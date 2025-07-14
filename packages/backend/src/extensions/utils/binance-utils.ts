import Big from "big.js"
import { groupBy } from "lodash-es"

import { AuditLog, Transaction } from "../../interfaces"
import { PlatformPrefix } from "../../settings/settings"
import { hashString } from "../../utils/utils"

export const BINANCE_PLATFORM_ID = `${PlatformPrefix.Exchange}binance`

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
      const _id = `${fileImportId}_${hash}_MERGED`
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
