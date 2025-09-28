import { TimeConsistencyError } from "src/errors"
import { AuditLog, EtherscanTransaction, Time, Transaction } from "src/interfaces"
import { PlatformPrefix } from "src/settings/settings"

import { ONE_DAY_TIME } from "./formatting-utils"

function trimTxId(fullId: string, platformId: string): string {
  const parts = fullId.split("_")

  // Example "1682669678_0xb41d6819932845278e7c451400f1778a952b35c6358dc51b49436438753f5113_NORMAL_0"
  const trimmedId = platformId.includes(PlatformPrefix.Chain)
    ? [parts[1], parts[2]].join("_")
    : parts[1]

  return trimmedId
}

function trimAuditLogId(fullId: string, platformId: string): string {
  const parts = fullId.split("_")

  // Example "1682669678_0xb41d6819932845278e7c451400f1778a952b35c6358dc51b49436438753f5113_NORMAL_0_VALUE_0"
  const trimmedId = platformId.includes(PlatformPrefix.Chain)
    ? [parts[1], parts[2], parts[4]].join("_")
    : parts[1]

  return trimmedId
}

export function sanitizeAuditLog(auditLog: AuditLog) {
  const {
    id: fullId,
    connectionId: _connectionId,
    fileImportId: _fileImportId,
    importIndex: _importIndex,
    platformId,
    txId: fullTxId,
    balance,
    ...rest
  } = auditLog

  const id = trimAuditLogId(fullId, auditLog.platformId)
  const txId = fullTxId ? trimTxId(fullTxId, auditLog.platformId) : undefined

  return {
    balance,
    id,
    platform: platformId, // TODO8
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
    ...rest
  } = transaction

  const id = trimTxId(transaction.id, transaction.platformId)

  return {
    _id: id, // TODO8
    platform: platformId, // TODO8
    ...rest,
  }
}

/**
 * Asserts that the records are in ascending order by time, no gaps, and no duplicates
 */
export function assertTimeConsistency(records: { time: Time }[], interval = ONE_DAY_TIME) {
  let prevRecord
  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    if (prevRecord && record.time !== prevRecord.time + interval) {
      console.log(prevRecord, record)
      throw new TimeConsistencyError(
        `Data must be asc, index ${i}, time ${record.time}, prevTime ${prevRecord.time}`
      )
    }
    prevRecord = record
  }
}
