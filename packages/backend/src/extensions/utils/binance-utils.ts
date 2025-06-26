import Big from "big.js"
import { groupBy } from "lodash-es"

import { AuditLog, Transaction } from "../../interfaces"
import { hashString } from "../../utils/utils"

function validAuditLogGrouping(logs: AuditLog[]) {
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
    if (!["Buy", "Sell", "Fee"].includes(log.operation)) {
      // hasInvalidOperation
      return false
    }
  }

  return hasBuy && hasSell
}

/**
 * @warn This function mutates the logs param
 */
export function extractTransactions(logs: AuditLog[], fileImportId: string): Transaction[] {
  const transactions: Transaction[] = []

  const timestampGroups = groupBy(logs, "timestamp")

  for (const i in timestampGroups) {
    const group = timestampGroups[i]

    if (validAuditLogGrouping(group)) {
      const wallet = group[0].wallet
      const platformId = group[0].platformId
      const timestamp = group[0].timestamp
      //
      const hash = hashString(`${timestamp}`)
      const _id = `${fileImportId}_${hash}`
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
      const fee = feeLogs
        .reduce((acc, log) => acc.plus(Big(log.change)), Big(0))
        .abs()
        .toString()
      const feeAsset = feeLogs[0]?.assetId
      // Price
      const price =
        typeof incoming === "string" && typeof outgoing === "string"
          ? Big(outgoing).div(Big(incoming)).toString()
          : undefined
      //
      const type = "Swap"

      transactions.push({
        fee,
        feeAsset,
        fileImportId,
        id: _id,
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
        log.txId = _id
      }
    }
  }
  return transactions
}

function validTransactionGrouping(transactions: Transaction[]) {
  for (let i = 0; i < transactions.length; i++) {
    if (i === 0) {
      continue
    }

    if (transactions[0].incomingAsset !== transactions[i].incomingAsset) {
      return false
    }

    if (transactions[0].incoming === undefined && transactions[i].incoming !== undefined) {
      return false
    }

    if (transactions[0].outgoingAsset !== transactions[i].outgoingAsset) {
      return false
    }

    if (transactions[0].outgoing === undefined && transactions[i].outgoing !== undefined) {
      return false
    }

    if (transactions[0].feeAsset !== transactions[i].feeAsset) {
      return false
    }

    if (transactions[0].fee === undefined && transactions[i].fee !== undefined) {
      return false
    }
  }

  return true
}

export function groupTransactions(transactions: Transaction[]): Transaction[] {
  const grouped: Transaction[] = []

  const groups: Record<string, Transaction[]> = {}
  for (const tx of transactions) {
    const key = `${tx.timestamp}_${tx.incomingAsset}_${tx.outgoingAsset}_${tx.feeAsset}`
    if (!groups[key]) {
      groups[key] = [tx]
    } else {
      groups[key].push(tx)
    }
  }

  for (const i in groups) {
    const group = groups[i]
    const validGrouping = validTransactionGrouping(group)

    if (group.length > 1 && validGrouping) {
      const tx = group[0]

      if (tx.incoming) {
        tx.incoming = group
          .reduce((acc, tx) => acc.plus(new Big(tx.incoming as string)), new Big(0))
          .toFixed()
      }
      if (tx.outgoing) {
        tx.outgoing = group
          .reduce((acc, tx) => acc.plus(new Big(tx.outgoing as string)), new Big(0))
          .toFixed()
      }
      if (tx.fee) {
        tx.fee = group
          .reduce((acc, tx) => acc.plus(new Big(tx.fee as string)), new Big(0))
          .toFixed()
      }

      grouped.push(tx)
    } else {
      grouped.push(...group)
    }
  }
  return grouped
}
