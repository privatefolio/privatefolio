import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult, ResolutionString } from "src/interfaces"
import { floorTimestamp } from "src/utils/utils"

import { BinanceMarginLiquidation, BinancePair } from "../binance-api"
import { BINANCE_WALLETS } from "../binance-settings"

export function parseMarginLiquidation(
  row: BinanceMarginLiquidation,
  index: number,
  connection: BinanceConnection,
  pair?: BinancePair
): ParserResult {
  const { platformId } = connection
  const { executedQty, isIsolated, orderId, symbol, time, side, avgPrice } = row
  const wallet = isIsolated ? BINANCE_WALLETS.isolatedMargin : BINANCE_WALLETS.crossMargin
  const timestamp = floorTimestamp(time, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${orderId}_binance`
  const importId = connection.id
  const importIndex = index

  let changeBN = new Big(executedQty)
  const priceBN = new Big(avgPrice)
  if (side === "SELL") {
    changeBN = changeBN.times(priceBN)
  } else {
    changeBN = changeBN.div(priceBN)
  }

  const outgoing = changeBN.toString()
  let outgoingAsset = `${platformId}:${symbol}`
  if (isIsolated && pair) {
    outgoingAsset = `${platformId}:${side === "SELL" ? pair.quoteAsset : pair.baseAsset}`
  }

  // TODO9
  return { logs: [] }

  const logs: AuditLog[] = [
    {
      assetId: outgoingAsset,
      change: `-${outgoing}`,
      fileImportId: importId,
      id: `${txId}_LOAN`,
      importIndex,
      operation: "Liquidation Repayment",
      platformId,
      timestamp,
      wallet,
    },
  ]
  return {
    logs,
  }
}
