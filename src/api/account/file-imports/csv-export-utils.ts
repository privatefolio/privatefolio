import { AuditLog, CsvData, EtherscanTransaction, Transaction } from "src/interfaces"
import { formatDateWithHour } from "src/utils/formatting-utils"

const HEADER = [
  "Identifier",
  "Timestamp",
  "Platform",
  "Wallet",
  "Type",
  "Incoming",
  "Outgoing",
  "Fee",
  "Smart Contract",
  "Smart Contract Method",
  "Blockchain Tx",
  "Notes",
]

const HeaderAuditLogs = [
  "Identifier",
  "Timestamp",
  "Platform",
  "Wallet",
  "Operation",
  "Change",
  "New Balance",
  "Transaction ID",
]

export function exportTransactionsToCsv(transactions: Transaction[]): CsvData {
  const rows: CsvData = transactions.map((tx) => [
    tx._id,
    formatDateWithHour(tx.timestamp, {
      timeZone: "UTC",
      timeZoneName: "short",
    }),
    tx.platform,
    tx.wallet,
    tx.type,
    tx.incoming,
    tx.outgoing,
    tx.fee,
    (tx as EtherscanTransaction).contractAddress,
    (tx as EtherscanTransaction).method,
    tx.txHash,
    tx.notes,
  ])

  const data: CsvData = [HEADER, ...rows]

  return data
}

export function exportAuditLogsToCsv(auditLogs: AuditLog[]): CsvData {
  const rows: CsvData = auditLogs.map((tx) => [
    tx._id,
    formatDateWithHour(tx.timestamp, {
      timeZone: "UTC",
      timeZoneName: "short",
    }),
    tx.platform,
    tx.wallet,
    tx.operation,
    tx.change,
    tx.balance,
    tx.txId,
  ])

  const data: CsvData = [HeaderAuditLogs, ...rows]

  return data
}
