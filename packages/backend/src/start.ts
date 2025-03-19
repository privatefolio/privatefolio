import { Cron } from "croner"
import { throttle } from "lodash-es"

import { api } from "./api/api"
import { BackendServer } from "./backend-server"
import { EventCause } from "./interfaces"
import { SHORT_THROTTLE_DURATION } from "./settings"

const accountNames = await api.getAccountNames()

const sideEffects: Record<string, () => void> = {}
const cronJobs: Record<string, Cron> = {}

async function setupSideEffects(accountName: string) {
  console.log(`Setting up side-effects for ${accountName}.`)

  const unsubscribe = await api.subscribeToAuditLogs(
    accountName,
    throttle(
      async (cause) => {
        console.log(`Running side-effects for ${accountName} (audit log changes).`)
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

  // TODO5 make this configurable
  // set up a cron job to refresh every 5 minutes
  const cronJob = new Cron("*/5 * * * *", async () => {
    console.log(`Cron: Refreshing account ${accountName}`)
    await api.enqueueRefreshBalances(accountName, "cron")
    await api.enqueueFetchPrices(accountName, "cron")
    await api.enqueueRefreshNetworth(accountName, "cron")
  })
  cronJobs[accountName] = cronJob
}

await api.subscribeToAccounts(async (cause, accountName) => {
  if (cause === EventCause.Deleted) {
    console.log(`Tearing down side-effects for ${accountName}.`)
    const unsubscribe = sideEffects[accountName]
    try {
      unsubscribe()

      if (cronJobs[accountName]) {
        cronJobs[accountName].stop()
        delete cronJobs[accountName]
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
