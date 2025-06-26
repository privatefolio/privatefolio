import { AuditLog, EtherscanTransaction, Transaction } from "src/interfaces"

export function trimTxId(fullId: string, platformId: string): string {
  const parts = fullId.split("_")

  // Example "1682669678_0xb41d6819932845278e7c451400f1778a952b35c6358dc51b49436438753f5113_NORMAL_0"
  const trimmedId =
    platformId === "ethereum" ? [parts[1], parts[2]].join("_") : parts.slice(1).join("_")

  return trimmedId
}

export function trimAuditLogId(fullId: string, platformId: string): string {
  const parts = fullId.split("_")

  // Example "1682669678_0xb41d6819932845278e7c451400f1778a952b35c6358dc51b49436438753f5113_NORMAL_0_VALUE_0"
  const trimmedId =
    platformId === "ethereum" ? [parts[1], parts[2], parts[4]].join("_") : parts.slice(1).join("_")

  return trimmedId
}

export function sanitizeAuditLog(auditLog: AuditLog) {
  const {
    id: fullId,
    connectionId: _connectionId,
    fileImportId: _fileImportId,
    importIndex: _importIndex,
    platformId,
    timestamp,
    txId: fullTxId,
    balance,
    ...rest
  } = auditLog

  const id = platformId === "binance" ? fullId : trimAuditLogId(fullId, auditLog.platformId)
  let txId = fullTxId ? trimTxId(fullTxId, auditLog.platformId) : undefined
  let time = timestamp

  if (platformId === "binance") {
    time = (timestamp / 1000) | 0
    txId = undefined
  }

  return {
    balance,
    id,
    platform: platformId,
    timestamp: time,
    txId,
    ...rest,
  }
}

export function normalizeTransaction(transaction: Transaction | EtherscanTransaction) {
  // const { ...rest } = transaction as EtherscanTransaction
  return sanitizeTransaction(transaction)
}

export function sanitizeTransaction(transaction: Transaction) {
  const {
    id: _fullId,
    connectionId: _connectionId,
    fileImportId: _fileImportId,
    importIndex: _importIndex,
    platformId,
    timestamp,
    ...rest
  } = transaction

  const id =
    platformId === "ethereum" ? trimTxId(transaction.id, transaction.platformId) : transaction.id
  let time = timestamp
  if (platformId === "binance") {
    time = (timestamp / 1000) | 0
  }

  return {
    _id: id,
    platform: platformId,
    timestamp: time,
    ...rest,
  }
}

export function assertTimeConsistency(records: { time: number }[]) {
  let prevRecord
  for (const record of records) {
    if (prevRecord && Number(record.time) !== Number(prevRecord.time) + 86400) {
      console.log(prevRecord, record)
      throw new Error("Inconsistency error")
    }
    prevRecord = record
  }
}
