import { proxy } from "comlink"
import {
  exportAuditLogsToCsv,
  exportTransactionsToCsv,
} from "src/api/account/file-imports/csv-export-utils"
import { AssetId, AuditLog, Connection } from "src/interfaces"
import { PriceApiId } from "src/settings"
import { $accountReset, $accounts, $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"

import { $filterOptionsMap, computeMetadata } from "../stores/metadata-store"
import { $taskQueue, enqueueTask, ProgressUpdate, TaskPriority } from "../stores/task-store"
import { clancy } from "../workers/remotes"
import { downloadCsv, downloadFile } from "./utils"

export function handleAuditLogChange(_auditLog?: AuditLog) {
  // TODO invalidate balancesCursor based on auditLog.timestamp
  enqueueFetchAssetInfos()
  enqueueDetectSpamTransactions()
  enqueueAutoMerge()
  enqueueIndexDatabase()
  //
  refreshNetworth()
}

export function refreshNetworth() {
  enqueueRefreshBalances()
  enqueueFetchPrices()
  enqueueRefreshNetworth()
}

export async function enqueueIndexDatabase() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Index database")

  if (existing) return

  return new Promise<void>((resolve) => {
    enqueueTask({
      description:
        "Index audit logs and transactions to allow sorting, filtering and quicker query times.",
      determinate: true,
      function: async (progress) => {
        const accountName = $activeAccount.get()
        const progressWithoutPercent = proxy((state: ProgressUpdate) => {
          progress([undefined, state[1] as string])
        })
        await clancy.indexAuditLogs(accountName, progressWithoutPercent)
        progress([33])
        await clancy.indexTransactions(accountName, progressWithoutPercent)
        progress([66])
        await clancy.indexDailyPrices(accountName, progressWithoutPercent)
        progress([99])
        await clancy.computeGenesis(accountName)
        await clancy.computeLastTx(accountName)
        resolve()
      },
      name: "Index database",
      priority: TaskPriority.Medium,
    })
  })
}

export function enqueueIndexTxnsDatabase() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Index transactions database")

  if (existing) return

  enqueueTask({
    description: "Index transactions to allow sorting, filtering and quicker query times.",
    determinate: true,
    function: async (progress) => {
      await clancy.indexTransactions($activeAccount.get(), progress)
      await clancy.computeGenesis($activeAccount.get())
      await clancy.computeLastTx($activeAccount.get())
    },
    name: "Index transactions database",
    priority: TaskPriority.Medium,
  })
}

export function enqueueIndexAuditLogsDatabase() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Index audit logs database")

  if (existing) return

  enqueueTask({
    description: "Index audit logs to allow sorting, filtering and quicker query times.",
    determinate: true,
    function: async (progress) => {
      await clancy.indexAuditLogs($activeAccount.get(), progress)
    },
    name: "Index audit logs database",
    priority: TaskPriority.Medium,
  })
}

export function enqueueRecomputeBalances() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Recompute balances")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Recomputing balances of owned assets.",
    determinate: true,
    function: async (progress, signal) => {
      await clancy.computeBalances($activeAccount.get(), { since: 0 }, progress, signal)
    },
    name: "Recompute balances",
    priority: TaskPriority.Medium,
  })
}

export function enqueueRefreshBalances() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Refresh balances")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Refreshing balances of owned assets.",
    determinate: true,
    function: async (progress, signal) => {
      await clancy.computeBalances($activeAccount.get(), undefined, progress, signal)
    },
    name: "Refresh balances",
    priority: TaskPriority.Medium,
  })
}

export function enqueueFetchPrices() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Fetch asset prices")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Fetching price data for all assets.",
    determinate: true,
    function: async (progress, signal) => {
      const assetMap = await computeMetadata()

      const assetIds: AssetId[] = []
      const priceApiMap: Partial<Record<AssetId, PriceApiId>> = {}

      for (const assetId in assetMap) {
        const asset = assetMap[assetId]
        if (asset.coingeckoId) {
          assetIds.push(assetId)
          priceApiMap[assetId] = asset.priceApiId
        }
      }

      await clancy.fetchDailyPrices(
        $activeAccount.get(),
        { assetIds, priceApiMap },
        progress,
        signal
      )
    },
    name: "Fetch asset prices",
    priority: TaskPriority.Low,
  })
}

export function enqueueDetectSpamTransactions() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Detect spam transactions")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Detect spam transactions.",
    determinate: true,
    function: async (progress, signal) => {
      await clancy.detectSpamTransactions($activeAccount.get(), progress, signal)
    },
    name: "Detect spam transactions",
    priority: TaskPriority.MediumPlus,
  })
}

export function enqueueAutoMerge() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Auto-merge transactions")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Auto-merging transactions.",
    determinate: true,
    function: async (progress, signal) => {
      await clancy.autoMergeTransactions($activeAccount.get(), progress, signal)
    },
    name: "Auto-merge transactions",
    priority: TaskPriority.MediumPlus,
  })
}

export function enqueueRecomputeNetworth() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Recompute networth")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Recomputing historical networth.",
    determinate: true,
    function: async (progress, signal) => {
      await clancy.computeNetworth($activeAccount.get(), 0, progress, signal)
    },
    name: "Recompute networth",
    priority: TaskPriority.Low,
  })
}

export function enqueueRefreshNetworth() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Refresh networth")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Refresh historical networth.",
    determinate: true,
    function: async (progress, signal) => {
      await clancy.computeNetworth($activeAccount.get(), undefined, progress, signal)
    },
    name: "Refresh networth",
    priority: TaskPriority.Low,
  })
}

export function enqueueSyncConnection(connection: Connection) {
  enqueueTask({
    abortable: true,
    description: `Sync "${connection.address}"`,
    determinate: true,
    function: async (progress, signal) => {
      await clancy.syncConnection(
        progress,
        connection,
        $activeAccount.get(),
        $debugMode.get(),
        undefined,
        undefined,
        signal
      )
      handleAuditLogChange()
    },
    name: "Sync connection",
    priority: TaskPriority.High,
  })
}

export function enqueueFetchAssetInfos() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Fetch asset infos")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Fetching info for all assets.",
    determinate: true,
    function: async (progress, signal) => {
      await computeMetadata()
      await clancy.fetchAssetInfos(
        $activeAccount.get(),
        $filterOptionsMap.get().assetId,
        progress,
        signal
      )
      await computeMetadata()
    },
    name: "Fetch asset infos",
    priority: TaskPriority.MediumPlus,
  })
}

export function enqueueDeleteAssetInfos() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Delete asset infos")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Deleting info for all assets.",
    determinate: true,
    function: async () => {
      await clancy.deleteAssetInfos($activeAccount.get())
      await computeMetadata()
    },
    name: "Delete asset infos",
    priority: TaskPriority.Low,
  })
}

export function enqueueExportAllTransactions() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Export all transactions")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Export all transactions.",
    determinate: true,
    function: async () => {
      const txns = await clancy.findTransactions({}, $activeAccount.get())
      const data = exportTransactionsToCsv(txns)
      downloadCsv(data, `${$activeAccount.get()}-transactions.csv`)
    },
    name: "Export all transactions",
    priority: TaskPriority.Low,
  })
}

export function enqueueExportAllAuditLogs() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Export all audit logs")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Export all audit logs.",
    determinate: true,
    function: async () => {
      const auditLogs = await clancy.findAuditLogs({}, $activeAccount.get())
      const data = exportAuditLogsToCsv(auditLogs)
      downloadCsv(data, `${$activeAccount.get()}-audit-logs.csv`)
    },
    name: "Export all audit logs",
    priority: TaskPriority.Low,
  })
}

export function enqueueBackup() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Backup")

  if (existing) return

  enqueueTask({
    abortable: true,
    description:
      "Backup account data, which can be used for restoring or migrating to another device.",
    determinate: true,
    function: async () => {
      const blob = await clancy.backupAccount($activeAccount.get())
      downloadFile(blob, `${$activeAccount.get()}-backup.zip`)
    },
    name: "Backup",
    priority: TaskPriority.Low,
  })
}

export async function enqueueRestore(file: File) {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Restore account")

  if (existing) return

  return new Promise<void>((resolve) => {
    enqueueTask({
      description: "Restore account data from a backup file.",
      determinate: true,
      function: async (progress) => {
        await clancy.restoreAccount($activeAccount.get(), file, progress)
        resolve()
      },
      name: "Restore account",
      priority: TaskPriority.Ultra,
    })
  })
}

export function enqueueResetAccount() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Reset account")

  if (existing) return

  enqueueTask({
    description: `Removing all data belonging to '${$activeAccount.get()}' from disk.`,
    function: async () => {
      await clancy.resetAccount($activeAccount.get())
      $accountReset.set(Math.random())
    },
    name: "Reset account",
    priority: TaskPriority.Ultra,
  })
}
export function enqueueDeleteAccount() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Delete account")

  if (existing) return

  enqueueTask({
    description: `Removing all data belonging to '${$activeAccount.get()}' from disk.`,
    function: async () => {
      await clancy.deleteAccount($activeAccount.get())
      const newAccounts = $accounts.get().filter((x) => x !== $activeAccount.get())
      $accounts.set(newAccounts)
    },
    name: "Delete account",
    priority: TaskPriority.High,
  })
}
