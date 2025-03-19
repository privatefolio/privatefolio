import { AuditLog, TaskTrigger } from "src/interfaces"

export function handleAuditLogChange(_auditLog?: AuditLog) {
  // TODO5 invalidate balancesCursor based on auditLog.timestamp
  // enqueueFetchAssetInfos()
  // enqueueDetectSpamTransactions()
  // enqueueAutoMerge()
  // enqueueIndexDatabase()
  // //
  // refreshNetworth()
}

export function enqueueExportAllTransactions(accountName: string, trigger: TaskTrigger) {
  // TODO5
  // return enqueueTask(accountName, {
  //   abortable: true,
  //   description: "Export all transactions.",
  //   determinate: true,
  //   function: async () => {
  //     const txns = await getTransactions(accountName)
  //     const data = exportTransactionsToCsv(txns)
  //     downloadCsv(data, `${accountName}-transactions.csv`)
  //   },
  //   name: "Export all transactions",
  //   priority: TaskPriority.Low,
  //   trigger,
  // })
}

export function enqueueExportAllAuditLogs(accountName: string, trigger: TaskTrigger) {
  // TODO5
  // return enqueueTask(accountName, {
  //   abortable: true,
  //   description: "Export all audit logs.",
  //   determinate: true,
  //   function: async () => {
  //     const auditLogs = await getAuditLogs(accountName)
  //     const data = exportAuditLogsToCsv(auditLogs)
  //     downloadCsv(data, `${accountName}-audit-logs.csv`)
  //   },
  //   name: "Export all audit logs",
  //   priority: TaskPriority.Low,
  //   trigger,
  // })
}
