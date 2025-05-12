import { Cron } from "croner"
import { throttle } from "lodash-es"

import { api } from "./api/api"
import { BackendServer } from "./backend-server"
import { EventCause } from "./interfaces"
import { SHORT_THROTTLE_DURATION } from "./settings"
import { getCronExpression } from "./utils/utils"

const accountNames = await api.getAccountNames()

const sideEffects: Record<string, () => void> = {}
const cronJobs: Record<string, Cron> = {}
const settingsSubscriptions: Record<string, () => void> = {}

async function setupCronJob(accountName: string) {
  if (cronJobs[accountName]) {
    console.log(`[${accountName}]`, `Stopping existing cron job.`)
    cronJobs[accountName].stop()
  }

  const { refreshInterval } = await api.getSettings(accountName)

  console.log(`[${accountName}]`, `Setting up cron job with interval: ${refreshInterval} minutes.`)
  const cronExpression = getCronExpression(refreshInterval)
  console.log(`[${accountName}]`, `Cron expression: ${cronExpression}`)

  const cronJob = new Cron(cronExpression, async () => {
    console.log(`[${accountName}]`, `Cron: Refreshing account.`)
    await api.enqueueRefreshBalances(accountName, "cron")
    await api.enqueueFetchPrices(accountName, "cron")
    await api.enqueueRefreshNetworth(accountName, "cron")
  })
  cronJobs[accountName] = cronJob
}

async function setupSideEffects(accountName: string) {
  console.log(`[${accountName}]`, `Setting up side-effects.`)

  const unsubscribe = await api.subscribeToAuditLogs(
    accountName,
    throttle(
      async (cause) => {
        console.log(`[${accountName}]`, `Running side-effects (trigger by audit log changes).`)
        if (cause === EventCause.Updated) return
        if (cause === EventCause.Reset) return

        await api.computeGenesis(accountName)
        await api.computeLastTx(accountName)

        if (cause === EventCause.Created) {
          await api.enqueueFetchAssetInfos(accountName, "side-effect")
          await api.enqueueDetectSpamTransactions(accountName, "side-effect")
          await api.enqueueAutoMerge(accountName, "side-effect")
        }

        // when created or deleted
        await api.enqueueRefreshBalances(accountName, "side-effect")

        if (cause === EventCause.Created) {
          await api.enqueueFetchPrices(accountName, "side-effect")
        }
        await api.enqueueRefreshNetworth(accountName, "side-effect")
      },
      SHORT_THROTTLE_DURATION,
      {
        leading: false,
        trailing: true,
      }
    )
  )

  sideEffects[accountName] = unsubscribe

  await setupCronJob(accountName)

  const settingsUnsubscribe = await api.subscribeToSettings(accountName, async () => {
    console.log(`[${accountName}]`, `Settings changed, refreshing cron job.`)
    await setupCronJob(accountName)
  })

  settingsSubscriptions[accountName] = settingsUnsubscribe
}

await api.subscribeToAccounts(async (cause, accountName) => {
  if (cause === EventCause.Deleted) {
    console.log(`[${accountName}]`, `Tearing down side-effects.`)
    const unsubscribe = sideEffects[accountName]
    try {
      unsubscribe()

      if (cronJobs[accountName]) {
        cronJobs[accountName].stop()
        delete cronJobs[accountName]
      }

      if (settingsSubscriptions[accountName]) {
        settingsSubscriptions[accountName]()
        delete settingsSubscriptions[accountName]
      }
    } catch {}
  }

  if (cause === EventCause.Created) {
    await setupSideEffects(accountName)
  }
})

for (const accountName of accountNames) {
  await setupSideEffects(accountName)
}

const server = new BackendServer(api)

const port = Number(process.env.PORT)
server.start(isNaN(port) ? 4001 : port)

process.on("SIGINT", () => {
  console.log("Shutting down server.")
  server.close()
  process.exit()
})
