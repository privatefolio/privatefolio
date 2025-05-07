import { AuditLog, TaskTrigger } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

import { handleRestoreRequest } from "./backup-utils"
import { requestFile } from "./utils"

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

export async function onRestoreRequest(handleClose: () => void) {
  const file = await requestFile([".zip"], false)
  handleClose()
  await $rpc.get().resetAccount($activeAccount.get())
  const fileRecord = await handleRestoreRequest(file[0])
  await $rpc.get().enqueueRestore($activeAccount.get(), "user", fileRecord)
}
