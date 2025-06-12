import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult } from "src/interfaces"

import { BinanceMarginLiquidation } from "../binance-account-api"

export function parseMarginLiquidation(
  row: BinanceMarginLiquidation,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const { executedQty, isIsolated, orderId, symbol, updatedTime } = row
  const wallet = isIsolated ? `Binance Isolated Margin` : `Binance Cross Margin`
  const timestamp = new Date(Number(updatedTime)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${updatedTime}`)
  }
  const txId = `${connection.id}_${orderId}_binance_${index}`
  const importId = connection.id
  const importIndex = index

  const changeBN = new Big(executedQty)
  const outgoing = changeBN.toFixed()
  const outgoingAsset = `binance:${symbol}`
  const logs: AuditLog[] = [
    {
      assetId: outgoingAsset,
      change: `-${outgoing}`,
      fileImportId: importId,
      id: `${txId}_LOAN`,
      importIndex,
      operation: "Liquidation Repayment",
      platform,
      timestamp,
      txId,
      wallet,
    },
  ]
  return {
    logs,
  }
}
