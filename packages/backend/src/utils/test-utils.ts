import { AuditLog, EtherscanTransaction, PlatformId, Transaction } from "src/interfaces"

export function trimTxId(fullId: string, platform: PlatformId): string {
  const parts = fullId.split("_")

  // Example "1682669678_0xb41d6819932845278e7c451400f1778a952b35c6358dc51b49436438753f5113_NORMAL_0"
  const trimmedId =
    platform === "ethereum" ? [parts[1], parts[2]].join("_") : parts.slice(1).join("_")

  return trimmedId
}

export function trimAuditLogId(fullId: string, platform: PlatformId): string {
  const parts = fullId.split("_")

  // Example "1682669678_0xb41d6819932845278e7c451400f1778a952b35c6358dc51b49436438753f5113_NORMAL_0_VALUE_0"
  const trimmedId =
    platform === "ethereum" ? [parts[1], parts[2], parts[4]].join("_") : parts.slice(1).join("_")

  return trimmedId
}

export function sanitizeAuditLog(auditLog: AuditLog) {
  const {
    id: fullId,
    connectionId: _connectionId,
    fileImportId: _fileImportId,
    importIndex: _importIndex,
    platform,
    timestamp,
    txId: fullTxId,
    balance,
    ...rest
  } = auditLog

  const id = platform === "binance" ? fullId : trimAuditLogId(fullId, auditLog.platform)
  let txId = fullTxId ? trimTxId(fullTxId, auditLog.platform) : undefined
  let time = timestamp

  if (platform === "binance") {
    time = (timestamp / 1000) | 0
    txId = undefined
  }

  return {
    balance,
    id,
    platform,
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
    platform,
    timestamp,
    ...rest
  } = transaction

  const id =
    platform === "ethereum" ? trimTxId(transaction.id, transaction.platform) : transaction.id
  let time = timestamp
  if (platform === "binance") {
    time = (timestamp / 1000) | 0
  }

  return {
    _id: id,
    platform,
    timestamp: time,
    ...rest,
  }
}
