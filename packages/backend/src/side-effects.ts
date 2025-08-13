import { proxy } from "comlink"
import { debounce } from "lodash-es"

import { getAccount } from "./api/accounts-api"
import { Api, api as readApi } from "./api/api"
import { setupCronJobs, stopCronJobs } from "./crons"
import {
  EventCause,
  ResolutionString,
  SubscriptionChannel,
  SubscriptionId,
  Timestamp,
} from "./interfaces"
import { logger } from "./logger"
import { MAX_DEBOUNCE_DURATION, SHORT_DEBOUNCE_DURATION } from "./settings/settings"
import { logAndReportError } from "./utils/error-utils"
import { ONE_DAY } from "./utils/formatting-utils"
import { floorTimestamp } from "./utils/utils"

async function setupSideEffects(accountName: string, writeApi: Api) {
  const account = await getAccount(accountName)
  const accountLogger = account.logger

  try {
    await writeApi.migrateTables(accountName)

    accountLogger.info(`Setting up side-effects.`)

    // Make sure the task queue is initialized
    await writeApi.getServerTasks(accountName)

    let nextTimestamp: Timestamp | undefined

    const handleAuditLogChange = async (
      cause: EventCause,
      oldestTimestamp?: Timestamp,
      groupId?: string
    ) => {
      if (!nextTimestamp) nextTimestamp = oldestTimestamp
      if (nextTimestamp > oldestTimestamp) nextTimestamp = oldestTimestamp
      await handleAuditLogChangeDebounced(cause, nextTimestamp, groupId)
      nextTimestamp = undefined
    }

    const handleAuditLogChangeDebounced = debounce(
      async (cause, oldestTimestamp?: Timestamp, groupId?: string) => {
        accountLogger.info(`Running side-effects (trigger by audit log changes).`)
        if (cause === EventCause.Updated) return

        await writeApi.computeGenesis(accountName)
        const lastTx = await writeApi.computeLastTx(accountName)

        if (oldestTimestamp) {
          let newCursor = floorTimestamp(oldestTimestamp, "1D" as ResolutionString) - ONE_DAY
          if (lastTx === 0) newCursor = 0
          await writeApi.invalidateBalances(accountName, newCursor)
          await writeApi.invalidateNetworth(accountName, newCursor)
          await writeApi.invalidateTrades(accountName, newCursor) // TESTME
          await writeApi.invalidateTradePnl(accountName, newCursor) // TESTME
        }

        if (lastTx !== 0) {
          if (cause === EventCause.Created) {
            await writeApi.enqueueDetectSpamTransactions(accountName, "side-effect", groupId)
            await writeApi.enqueueAutoMerge(accountName, "side-effect", groupId)
          }

          // when created or deleted
          await writeApi.enqueueRefreshBalances(accountName, "side-effect", groupId)

          if (cause === EventCause.Created) {
            await writeApi.enqueueFetchPrices(accountName, "side-effect", groupId)
          }
          await writeApi.enqueueRefreshNetworth(accountName, "side-effect", groupId)
          await writeApi.enqueueRefreshTrades(accountName, "side-effect", groupId)
        }

        const account = await getAccount(accountName)
        account.eventEmitter.emit(SubscriptionChannel.Metadata)
      },
      SHORT_DEBOUNCE_DURATION,
      {
        leading: false,
        maxWait: MAX_DEBOUNCE_DURATION,
        trailing: true,
      }
    )
    const subId = await writeApi.subscribeToAuditLogs(accountName, proxy(handleAuditLogChange))

    sideEffects[accountName] = subId

    await setupCronJobs(accountName, writeApi as Api)
  } catch (error) {
    logAndReportError(error as Error, `Error setting up side-effects:`, {}, accountLogger)
  }
}

async function handleAccountsSideEffects(writeApi: Api, startServer: () => Promise<void>) {
  const accounts = await writeApi.getAccountNames()
  if (accounts.length === 0) return

  for (const accountName of accounts) {
    await writeApi.subscribeToSettingsProperty(
      accountName,
      "kioskMode",
      proxy(async () => {
        logger.info("Kiosk mode changed, restarting server")
        await startServer()
      })
    )
  }
}

const sideEffects: Record<string, SubscriptionId> = {}

export async function setupAllSideEffects(writeApi: Api, startServer: () => Promise<void>) {
  const accountNames = await writeApi.getAccountNames()

  for (const accountName of accountNames) {
    await setupSideEffects(accountName, writeApi)
  }

  await writeApi.subscribeToAccounts(
    proxy(async (cause, accountName) => {
      if (cause === EventCause.Deleted) {
        const account = await getAccount(accountName)
        const accountLogger = account.logger
        accountLogger.info(`Tearing down side-effects.`)
        const subId = sideEffects[accountName]
        try {
          await writeApi.unsubscribe(subId, false)
          await stopCronJobs(accountName, writeApi as Api)
        } catch {}
        accountLogger.info(`Tore down side-effects.`)
        await readApi.disconnectAccount(accountName)
      }

      if (cause === EventCause.Reset) {
        try {
          await readApi.reconnectAccount(accountName)
          await setupSideEffects(accountName, writeApi)
          await handleAccountsSideEffects(writeApi, startServer)
        } catch {}
      }

      if (cause === EventCause.Created) {
        await setupSideEffects(accountName, writeApi)
        await handleAccountsSideEffects(writeApi, startServer)
      }
    })
  )
}
