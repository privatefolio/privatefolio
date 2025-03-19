import { AuditLog, CsvData, EtherscanTransaction, Transaction } from "src/interfaces"
import { toUTCString } from "src/utils/formatting-utils"

const HEADER = [
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

const HeaderAuditLogs = [
  "Timestamp",
  "Platform",
  "Wallet",
  "Operation",
  "Change",
  "Asset",
  "New Balance",
]

export function exportTransactionsToCsv(transactions: Transaction[]): CsvData {
  const rows: CsvData = transactions.map((tx) => [
    toUTCString(tx.timestamp),
    tx.platform,
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

  const data: CsvData = [HEADER, ...rows]

  return data
}

export function exportAuditLogsToCsv(auditLogs: AuditLog[]): CsvData {
  const rows: CsvData = auditLogs.map((logs) => [
    toUTCString(logs.timestamp),
    logs.platform,
    logs.wallet,
    logs.operation,
    logs.change,
    logs.assetId,
    logs.balance,
  ])

  const data: CsvData = [HeaderAuditLogs, ...rows]

  return data
}
