import "./logger"

import { proxy, wrap } from "comlink"
import { Cron } from "croner"
import { throttle } from "lodash-es"

import { refetchAssetsIfNeeded } from "./api/account/assets-api"
import { refetchPlatformsIfNeeded } from "./api/account/platforms-api"
import { Api, api } from "./api/api"
import { BackendServer } from "./backend-server"
import { EventCause, SubscriptionId } from "./interfaces"
import { SHORT_THROTTLE_DURATION } from "./settings/settings"
import { getCronExpression, getPrefix, isDevelopment } from "./utils/utils"

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

let kioskMode = false
for (const accountName of accountNames) {
  const accountSettings = await writeApi.getSettings(accountName)
  if (accountSettings.kioskMode) {
    kioskMode = true
    break
  }
}

const sideEffects: Record<string, SubscriptionId> = {}
const networthCronJobs: Record<string, Cron> = {}
const metadataCronJobs: Record<string, Cron> = {}
const settingsSubscriptions: Record<string, SubscriptionId> = {}
let server: BackendServer<Api>

function startServer() {
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
    await writeApi.subscribeToSettings(
      accountName,
      proxy(async (settings) => {
        if (settings.kioskMode) {
          kioskMode = true
          // Restart server with new kiosk mode
          startServer()
        }
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

  const subId = await writeApi.subscribeToAuditLogs(
    accountName,
    proxy(
      throttle(
        async (cause) => {
          console.log(
            getPrefix(accountName, true),
            `Running side-effects (trigger by audit log changes).`
          )
          if (cause === EventCause.Updated) return
          if (cause === EventCause.Reset) return

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

  const settingsSubId = await writeApi.subscribeToSettings(
    accountName,
    proxy(async () => {
      console.log(getPrefix(accountName, true), `Settings changed, refreshing cron jobs.`)
      await setupNetworthCronJob(accountName)
      await setupMetadataCronJob(accountName)
    })
  )

  settingsSubscriptions[accountName] = settingsSubId
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

        if (settingsSubscriptions[accountName]) {
          await writeApi.unsubscribe(settingsSubscriptions[accountName])
          delete settingsSubscriptions[accountName]
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
await refetchAssetsIfNeeded()
await refetchPlatformsIfNeeded()

startServer()

process.on("SIGINT", () => {
  console.log("Shutting down server.")
  server.close()
  worker.terminate()
  process.exit()
})
