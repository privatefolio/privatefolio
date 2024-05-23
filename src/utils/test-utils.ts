import { AuditLog, BalanceMap, EtherscanTransaction, PlatformId, Transaction } from "src/interfaces"

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
    _rev,
    _id: fullId,
    importId: _importId,
    importIndex: _importIndex,
    platform,
    timestamp,
    txId: fullTxId,
    balance, // FIXME - this should not be excluded
    balanceN, // FIXME - this should not be excluded
    ...rest
  } = auditLog

  const _id = platform === "binance" ? "" : trimAuditLogId(fullId, auditLog.platform)
  const txId =
    platform === "binance" ? "" : fullTxId ? trimTxId(fullTxId, auditLog.platform) : undefined
  let time = timestamp
  if (platform === "binance") {
    time = (timestamp / 1000) | 0
  }

  return {
    _id,
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
    _rev,
    _id: _fullId,
    importId: _importId,
    importIndex: _importIndex,
    platform,
    timestamp,
    txHash,
    ...rest
  } = transaction

  const _id = platform === "ethereum" ? trimTxId(transaction._id, transaction.platform) : ""
  let time = timestamp
  if (platform === "binance") {
    time = (timestamp / 1000) | 0
  }

  return {
    _id,
    platform,
    timestamp: time,
    ...rest,
  }
}

export function sanitizeBalance(balance: BalanceMap): Partial<BalanceMap> {
  const { _rev, _id, ...rest } = balance
  return rest
}

/**
 * FIXME this should not be needed
 */
export function sortTransactions(
  a: Pick<Transaction, "timestamp" | "platform" | "_id" | "priceN" | "outgoingN">,
  b: Pick<Transaction, "timestamp" | "platform" | "_id" | "priceN" | "outgoingN">
) {
  let delta = b.timestamp - a.timestamp

  if (delta === 0 && a.platform === "ethereum") {
    return trimTxId(a._id, a.platform).localeCompare(trimTxId(b._id, b.platform))
  }

  if (delta === 0 && a.platform === "binance") {
    delta = (a.priceN || 0) - (b.priceN || 0)
    if (delta === 0) {
      return (a.outgoingN || 0) - (b.outgoingN || 0)
    }
  }

  return delta
}

/**
 * FIXME this should not be needed, resolve it in findAuditLogs
 */
export function sortAuditLogs(
  a: Pick<AuditLog, "timestamp" | "changeN">,
  b: Pick<AuditLog, "timestamp" | "changeN">
) {
  const delta = b.timestamp - a.timestamp

  if (delta === 0) {
    return a.changeN - b.changeN
  }

  return delta
}
