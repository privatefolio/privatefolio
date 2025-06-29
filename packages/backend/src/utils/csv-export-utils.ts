import { AuditLog, CsvData, EtherscanTransaction, Transaction } from "src/interfaces"
import { toUTCString } from "src/utils/formatting-utils"

const txnsHeader = [
  "Timestamp",
  "Platform",
  "Wallet",
  "Type",
  "Incoming",
  "Incoming Asset",
  "Outgoing",
  "Outgoing Asset",
  "Fee",
  "Fee Asset",
  "Smart Contract",
  "Smart Contract Method",
  "Blockchain Tx",
  "Notes",
]

const auditLogsHeader = [
  "Timestamp",
  "Platform",
  "Wallet",
  "Operation",
  "Change",
  "Asset",
  "Wallet balance",
]

export function transformTransactionsToCsv(transactions: Transaction[]): CsvData {
  const rows: CsvData = transactions.map((tx) => [
    toUTCString(tx.timestamp),
    tx.platformId,
    tx.wallet,
    tx.type,
    tx.incoming,
    tx.incomingAsset,
    tx.outgoing,
    tx.outgoingAsset,
    tx.fee,
    tx.feeAsset,
    (tx as EtherscanTransaction).metadata?.contractAddress,
    (tx as EtherscanTransaction).metadata?.method,
    (tx as EtherscanTransaction).metadata?.txHash,
    tx.notes,
  ])

  const data: CsvData = [txnsHeader, ...rows]

  return data
}

export function transformAuditLogsToCsv(auditLogs: AuditLog[]): CsvData {
  const rows: CsvData = auditLogs.map((logs) => [
    toUTCString(logs.timestamp),
    logs.platformId,
    logs.wallet,
    logs.operation,
    logs.change,
    logs.assetId,
    logs.balance,
  ])

  const data: CsvData = [auditLogsHeader, ...rows]

  return data
}
