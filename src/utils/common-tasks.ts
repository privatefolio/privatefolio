import JSZip from "jszip"
import {
  exportAuditLogsToCsv,
  exportTransactionsToCsv,
} from "src/api/account/file-imports/csv-export-utils"
import { AssetId, AuditLog, Connection } from "src/interfaces"
import { PriceApiId } from "src/settings"
import { $activeAccount } from "src/stores/account-store"

import { $filterOptionsMap, computeMetadata } from "../stores/metadata-store"
import { $taskQueue, enqueueTask, TaskPriority } from "../stores/task-store"
import { clancy } from "../workers/remotes"
import { createCsvString, downloadCsv, downloadFile } from "./utils"

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

export function enqueueIndexDatabase() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Index database")

  if (existing) return

  enqueueTask({
    description:
      "Index audit logs and transactions to allow sorting, filtering and quicker query times.",
    determinate: true,
    function: async (progress) => {
      await clancy.indexAuditLogs(progress, $activeAccount.get())
      await clancy.indexTransactions(progress, $activeAccount.get())
      await clancy.computeGenesis($activeAccount.get())
      await clancy.computeLastTx($activeAccount.get())
    },
    name: "Index database",
    priority: TaskPriority.Medium,
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
      await clancy.indexTransactions(progress, $activeAccount.get())
      await clancy.computeGenesis($activeAccount.get())
      await clancy.computeLastTx($activeAccount.get())
    },
    name: "Index transactions database",
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

      await clancy.fetchDailyPrices({ assetIds, priceApiMap }, progress, signal)
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
    description: `Sync "${connection.address}"`,
    determinate: true,
    function: async (progress) => {
      await clancy.syncConnection(progress, connection, $activeAccount.get())
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

export function enqueueExportAppData() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Export app data")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Export app data",
    determinate: true,
    function: async () => {
      const auditLogs = await clancy.findAuditLogs({}, $activeAccount.get())
      const auditLogsFile = createCsvString(exportAuditLogsToCsv(auditLogs))
      const txns = await clancy.findTransactions({}, $activeAccount.get())
      const txnsFile = createCsvString(exportTransactionsToCsv(txns))

      const zip = new JSZip()
      zip.file(`${$activeAccount.get()}-audit-logs.csv`, auditLogsFile)
      zip.file(`${$activeAccount.get()}-transactions.csv`, txnsFile)

      zip.generateAsync({ type: "blob" }).then(function (blob) {
        downloadFile(blob, `${$activeAccount.get()}-data.zip`)
      })
    },
    name: "Export app data",
    priority: TaskPriority.Low,
  })
}

export function enquenceBackup() {
  const taskQueue = $taskQueue.get()

  const existing = taskQueue.find((task) => task.name === "Backup")

  if (existing) return

  enqueueTask({
    abortable: true,
    description: "Backup",
    determinate: true,
    function: async () => {
      const dbs = await clancy.backup($activeAccount.get())
      const zip = new JSZip()
      for (const db of dbs) {
        zip.file(`${db[0]}-${$activeAccount.get()}.txt`, db[1])
      }
      zip.generateAsync({ type: "blob" }).then(function (blob) {
        downloadFile(blob, `${$activeAccount.get()}-Backup.zip`)
      })
    },
    name: "Backup",
    priority: TaskPriority.Low,
  })
}

// export function enquenceRestore() {
//   const taskQueue = $taskQueue.get()

//   const existing = taskQueue.find((task) => task.name === "Restore")

//   if (existing) return

//   enqueueTask({
//     abortable: true,
//     description: "Backup",
//     determinate: true,
//     function: async () => {},
//     name: "Restore",
//     priority: TaskPriority.Low,
//   })
// }
