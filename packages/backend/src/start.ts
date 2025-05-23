import "./logger"

import { proxy, wrap } from "comlink"
import { Cron } from "croner"
import { throttle } from "lodash-es"

import { Api, api } from "./api/api"
import { BackendServer } from "./backend-server"
import { EventCause, SubscriptionId } from "./interfaces"
import { SHORT_THROTTLE_DURATION } from "./settings"
import { getCronExpression, getPrefix } from "./utils/utils"

const worker = new Worker(import.meta.resolve("./api-worker.ts"))
const writeApi = wrap<Api>(worker)

const accountNames = await writeApi.getAccountNames()

const sideEffects: Record<string, SubscriptionId> = {}
const cronJobs: Record<string, Cron> = {}
const settingsSubscriptions: Record<string, SubscriptionId> = {}

async function setupCronJob(accountName: string) {
  if (cronJobs[accountName]) {
    console.log(getPrefix(accountName), `Stopping existing cron job.`)
    cronJobs[accountName].stop()
  }

  const { refreshInterval } = await writeApi.getSettings(accountName)

  console.log(
    getPrefix(accountName),
    `Setting up cron job with interval: ${refreshInterval} minutes.`
  )
  const cronExpression = getCronExpression(refreshInterval)
  console.log(getPrefix(accountName), `Cron expression: ${cronExpression}`)

  const cronJob = new Cron(cronExpression, async () => {
    console.log(getPrefix(accountName), `Cron: Refreshing account.`)
    await writeApi.enqueueRefreshBalances(accountName, "cron")
    await writeApi.enqueueFetchPrices(accountName, "cron")
    await writeApi.enqueueRefreshNetworth(accountName, "cron")
  })
  cronJobs[accountName] = cronJob
}

async function setupSideEffects(accountName: string) {
  console.log(getPrefix(accountName), `Setting up side-effects.`)

  const subId = await writeApi.subscribeToAuditLogs(
    accountName,
    proxy(
      throttle(
        async (cause) => {
          console.log(
            getPrefix(accountName),
            `Running side-effects (trigger by audit log changes).`
          )
          if (cause === EventCause.Updated) return
          if (cause === EventCause.Reset) return

          await writeApi.computeGenesis(accountName)
          await writeApi.computeLastTx(accountName)

          if (cause === EventCause.Created) {
            await writeApi.enqueueFetchAssetInfos(accountName, "side-effect")
            await writeApi.enqueueDetectSpamTransactions(accountName, "side-effect")
            await writeApi.enqueueAutoMerge(accountName, "side-effect")
          }

          // when created or deleted
          await writeApi.enqueueRefreshBalances(accountName, "side-effect")

          if (cause === EventCause.Created) {
            await writeApi.enqueueFetchPrices(accountName, "side-effect")
          }
          await writeApi.enqueueRefreshNetworth(accountName, "side-effect")
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

  await setupCronJob(accountName)

  const settingsSubId = await writeApi.subscribeToSettings(
    accountName,
    proxy(async () => {
      console.log(getPrefix(accountName), `Settings changed, refreshing cron job.`)
      await setupCronJob(accountName)
    })
  )

  settingsSubscriptions[accountName] = settingsSubId
}

await writeApi.subscribeToAccounts(
  proxy(async (cause, accountName) => {
    if (cause === EventCause.Deleted) {
      console.log(getPrefix(accountName), `Tearing down side-effects.`)
      const subId = sideEffects[accountName]
      try {
        await writeApi.unsubscribe(subId)

        if (cronJobs[accountName]) {
          cronJobs[accountName].stop()
          delete cronJobs[accountName]
        }

        if (settingsSubscriptions[accountName]) {
          await writeApi.unsubscribe(settingsSubscriptions[accountName])
          delete settingsSubscriptions[accountName]
        }
      } catch {}
    }

    if (cause === EventCause.Created) {
      await setupSideEffects(accountName)
    }
  })
)

for (const accountName of accountNames) {
  await setupSideEffects(accountName)
}

const server = new BackendServer(api, writeApi as Api)

const port = Number(process.env.PORT)
server.start(isNaN(port) ? 4001 : port)

process.on("SIGINT", () => {
  console.log("Shutting down server.")
  server.close()
  worker.terminate()
  process.exit()
})
