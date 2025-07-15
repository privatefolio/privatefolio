import Big from "big.js"
import { groupBy } from "lodash-es"

import { AuditLog, Transaction } from "../../interfaces"
import { PlatformPrefix } from "../../settings/settings"
import { hashString } from "../../utils/utils"

export const BINANCE_PLATFORM_ID = `${PlatformPrefix.Exchange}binance`

function isGroupableOperation(operation: string) {
  return ["Buy", "Sell", "Fee"].includes(operation)
}

function isValidTransactionGroup(logs: AuditLog[]) {
  let hasBuy = false
  let hasSell = false
  //
  for (const log of logs) {
    if (log.operation === "Buy") {
      hasBuy = true
    }
    if (log.operation === "Sell") {
      hasSell = true
    }
    if (!isGroupableOperation(log.operation)) {
      return false
    }
  }

  return hasBuy && hasSell
}

function isMergeableAuditLogGroup(logs: AuditLog[]) {
  let assetId: string | undefined
  let operation: string | undefined
  //
  for (const log of logs) {
    if (assetId === undefined) {
      assetId = log.assetId
    }
    if (operation === undefined) {
      operation = log.operation
    }
    if (assetId !== log.assetId || operation !== log.operation) {
      return false
    }
  }

  return true
}

export function mergeAuditLogs(logs: AuditLog[], importId: string): AuditLog[] {
  const mergedLogs: AuditLog[] = []

  const timestampGroups = groupBy(
    logs,
    (x) => `${x.timestamp}_${x.assetId}_${x.operation}_${x.wallet}`
  )

  for (const i in timestampGroups) {
    const group = timestampGroups[i]

    if (isMergeableAuditLogGroup(group)) {
      const change = group.reduce((acc, log) => acc.plus(Big(log.change)), Big(0))
      const auditLog = group[0]

      mergedLogs.push({
        ...auditLog,
        change: change.toString(),
        id: `${importId}_${hashString(`${auditLog.assetId}_${auditLog.operation}_${change.toString()}`)}`,
      })
    } else {
      mergedLogs.push(...group)
    }
  }
  return mergedLogs
}

/**
 * @warn This function mutates the logs param
 */
export function extractTransactions(logs: AuditLog[], importId: string): Transaction[] {
  const transactions: Transaction[] = []

  const timestampGroups = groupBy(
    logs,
    (x) => `${x.timestamp}_${x.wallet}_${isGroupableOperation(x.operation)}`
  )

  for (const i in timestampGroups) {
    const group = timestampGroups[i]

    if (isValidTransactionGroup(group)) {
      const wallet = group[0].wallet
      const platformId = group[0].platformId
      const timestamp = group[0].timestamp
      // Incoming
      const buyLogs = group.filter((log) => log.operation === "Buy")
      const incomingAsset: string | undefined = buyLogs[0]?.assetId
      const incoming = incomingAsset
        ? buyLogs.reduce((acc, log) => acc.plus(Big(log.change)), Big(0)).toString()
        : undefined
      // Outgoing
      const sellLogs = group.filter((log) => log.operation === "Sell")
      const outgoingAsset: string | undefined = sellLogs[0]?.assetId
      const outgoing = outgoingAsset
        ? sellLogs
            .reduce((acc, log) => acc.plus(Big(log.change)), Big(0))
            .abs()
            .toString()
        : undefined
      // Fee
      const feeLogs = group.filter((log) => log.operation === "Fee")
      const feeAsset = feeLogs[0]?.assetId
      const fee = feeAsset
        ? feeLogs
            .reduce((acc, log) => acc.plus(Big(log.change)), Big(0))
            .abs()
            .toString()
        : undefined
      // Price
      const price =
        typeof incoming === "string" && typeof outgoing === "string"
          ? Big(outgoing).div(Big(incoming)).toString()
          : undefined
      //
      const type = "Swap"

      const txId = `${importId}_${hashString(`${incomingAsset}_${outgoingAsset}_${price}`)}`
      transactions.push({
        fee,
        feeAsset,
        fileImportId: importId,
        id: txId,
        importIndex: parseInt(i),
        incoming,
        incomingAsset,
        metadata: {},
        outgoing,
        outgoingAsset,
        platformId,
        price,
        timestamp,
        type,
        wallet,
      })

      // update audit logs with txId
      for (const log of group) {
        log.txId = txId
      }
    }
  }
  return transactions
}
