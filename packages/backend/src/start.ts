import "./logger"

import { proxy, wrap } from "comlink"
import { Cron } from "croner"
import { throttle } from "lodash-es"

import { getAccount } from "./api/accounts-api"
import { Api, api } from "./api/api"
import { BackendServer } from "./backend-server"
import {
  EventCause,
  ResolutionString,
  SubscriptionChannel,
  SubscriptionId,
  Timestamp,
} from "./interfaces"
import { SHORT_THROTTLE_DURATION } from "./settings/settings"
import { ONE_DAY } from "./utils/formatting-utils"
import { floorTimestamp, getCronExpression, getPrefix, isDevelopment } from "./utils/utils"

console.log("Starting worker...")
const worker = new Worker(import.meta.resolve("./api-worker"), {
  env: {
    ALLOW_WRITES: "true",
    BUN_WORKER: "true",
    ...process.env,
  },
})
const writeApi = wrap<Api>(worker)
console.log("Started worker...")

const accountNames = await writeApi.getAccountNames()

async function getKioskMode() {
  let kioskMode = false
  for (const accountName of accountNames) {
    const accountSettings = await writeApi.getSettings(accountName)
    if (accountSettings.kioskMode) {
      kioskMode = true
      break
    }
  }
  return kioskMode
}

const sideEffects: Record<string, SubscriptionId> = {}
const networthCronJobs: Record<string, Cron> = {}
const metadataCronJobs: Record<string, Cron> = {}
const networthIntervalSubs: Record<string, SubscriptionId> = {}
const metadataIntervalSubs: Record<string, SubscriptionId> = {}
let server: BackendServer<Api>

async function startServer() {
  const kioskMode = await getKioskMode()
  server?.close()
  server = new BackendServer(api, writeApi as Api, false, kioskMode, function shutdown() {
    console.log("Shutting down server.")
    worker.terminate()
    if (!isDevelopment) process.exit()
  })

  const port = Number(process.env.PORT)
  server.start(isNaN(port) ? 4001 : port)
}

async function handleAccountsSideEffects() {
  const accounts = await writeApi.getAccountNames()
  if (accounts.length === 0) return

  for (const accountName of accounts) {
    await writeApi.subscribeToSettingsProperty(
      accountName,
      "kioskMode",
      proxy(async () => {
        console.log("Kiosk mode changed, restarting server.")
        await startServer()
      })
    )
  }
}

async function setupNetworthCronJob(accountName: string) {
  if (networthCronJobs[accountName]) {
    console.log(getPrefix(accountName, true), `Stopping existing networth cron job.`)
    networthCronJobs[accountName].stop()
  }

  const { networthRefreshInterval } = await writeApi.getSettings(accountName)

  console.log(
    getPrefix(accountName, true),
    `Setting up networth cron job with interval: ${networthRefreshInterval} minutes.`
  )
  try {
    const cronExpression = getCronExpression(networthRefreshInterval)
    console.log(getPrefix(accountName, true), `Networth cron expression: ${cronExpression}`)

    const cronJob = new Cron(cronExpression, async () => {
      console.log(getPrefix(accountName, true), `Cron: Refreshing account.`)
      await writeApi.enqueueRefreshBalances(accountName, "cron")
      await writeApi.enqueueFetchPrices(accountName, "cron")
      await writeApi.enqueueRefreshNetworth(accountName, "cron")
      await writeApi.enqueueRefreshTrades(accountName, "cron")
    })
    networthCronJobs[accountName] = cronJob
  } catch (error) {
    console.error(getPrefix(accountName, true), `Error setting up networth cron job:`, error)
  }
}

async function setupMetadataCronJob(accountName: string) {
  if (metadataCronJobs[accountName]) {
    console.log(getPrefix(accountName, true), `Stopping existing metadata cron job.`)
    metadataCronJobs[accountName].stop()
  }

  const { metadataRefreshInterval } = await writeApi.getSettings(accountName)

  console.log(
    getPrefix(accountName, true),
    `Setting up metadata cron job with interval: ${metadataRefreshInterval} minutes.`
  )
  try {
    const cronExpression = getCronExpression(metadataRefreshInterval)
    console.log(getPrefix(accountName, true), `Metadata cron expression: ${cronExpression}`)

    const cronJob = new Cron(cronExpression, async () => {
      console.log(getPrefix(accountName, true), `Cron: Refreshing metadata.`)
      await writeApi.enqueueRefetchAssets(accountName, "cron")
      await writeApi.enqueueRefetchPlatforms(accountName, "cron")
    })
    metadataCronJobs[accountName] = cronJob
  } catch (error) {
    console.error(getPrefix(accountName, true), `Error setting up metadata cron job:`, error)
  }
}

async function setupSideEffects(accountName: string) {
  console.log(getPrefix(accountName, true), `Setting up side-effects.`)

  // Make sure the task queue is initialized
  await writeApi.getServerTasks(accountName)

  const subId = await writeApi.subscribeToAuditLogs(
    accountName,
    proxy(
      throttle(
        async (cause, oldestTimestamp?: Timestamp) => {
          console.log(
            getPrefix(accountName, true),
            `Running side-effects (trigger by audit log changes).`
          )
          if (cause === EventCause.Updated) return

          if (oldestTimestamp) {
            const newCursor = floorTimestamp(oldestTimestamp, "1D" as ResolutionString) - ONE_DAY
            await writeApi.invalidateBalances(accountName, newCursor)
            await writeApi.invalidateNetworth(accountName, newCursor)
            await writeApi.invalidateTrades(accountName, newCursor)
            await writeApi.invalidateTradePnl(accountName, newCursor)
          }
          await writeApi.computeGenesis(accountName)
          await writeApi.computeLastTx(accountName)

          if (cause === EventCause.Created) {
            await writeApi.enqueueDetectSpamTransactions(accountName, "side-effect")
            await writeApi.enqueueAutoMerge(accountName, "side-effect")
          }

          // when created or deleted
          await writeApi.enqueueRefreshBalances(accountName, "side-effect")

          if (cause === EventCause.Created) {
            await writeApi.enqueueFetchPrices(accountName, "side-effect")
          }
          await writeApi.enqueueRefreshNetworth(accountName, "side-effect")
          await writeApi.enqueueRefreshTrades(accountName, "side-effect")

          const account = await getAccount(accountName)
          account.eventEmitter.emit(SubscriptionChannel.Metadata)
        },
        SHORT_THROTTLE_DURATION,
        {
          leading: false,
          trailing: true,
        }
      )
    )
  )

  sideEffects[accountName] = subId

  await setupNetworthCronJob(accountName)
  await setupMetadataCronJob(accountName)

  const networthIntervalSubId = await writeApi.subscribeToSettingsProperty(
    accountName,
    "networthRefreshInterval",
    proxy(async () => {
      console.log(
        getPrefix(accountName, true),
        `Networth refresh interval changed, refreshing cron job.`
      )
      await setupNetworthCronJob(accountName)
    })
  )

  networthIntervalSubs[accountName] = networthIntervalSubId

  const metadataIntervalSubId = await writeApi.subscribeToSettingsProperty(
    accountName,
    "metadataRefreshInterval",
    proxy(async () => {
      console.log(
        getPrefix(accountName, true),
        `Metadata refresh interval changed, refreshing cron job.`
      )
      await setupMetadataCronJob(accountName)
    })
  )

  metadataIntervalSubs[accountName] = metadataIntervalSubId
}

await writeApi.subscribeToAccounts(
  proxy(async (cause, accountName) => {
    if (cause === EventCause.Deleted) {
      console.log(getPrefix(accountName, true), `Tearing down side-effects.`)
      const subId = sideEffects[accountName]
      try {
        await writeApi.unsubscribe(subId)

        if (networthCronJobs[accountName]) {
          networthCronJobs[accountName].stop()
          delete networthCronJobs[accountName]
        }

        if (metadataCronJobs[accountName]) {
          metadataCronJobs[accountName].stop()
          delete metadataCronJobs[accountName]
        }

        if (networthIntervalSubs[accountName]) {
          await writeApi.unsubscribe(networthIntervalSubs[accountName])
          delete networthIntervalSubs[accountName]
        }
        if (metadataIntervalSubs[accountName]) {
          await writeApi.unsubscribe(metadataIntervalSubs[accountName])
          delete metadataIntervalSubs[accountName]
        }
      } catch {}
    }

    if (cause === EventCause.Reset) {
      try {
        await api.reconnectAccount(accountName)
      } catch {}
    }

    if (cause === EventCause.Created) {
      await setupSideEffects(accountName)
      await handleAccountsSideEffects()
    }
  })
)

for (const accountName of accountNames) {
  await setupSideEffects(accountName)
}

await handleAccountsSideEffects()
await startServer()

process.on("SIGINT", () => {
  console.log("Shutting down server.")
  server.close()
  worker.terminate()
  process.exit()
})
