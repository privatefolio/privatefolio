import { AuditLog, BinanceConnection, ParserResult } from "src/interfaces"

import { BinanceMarginLiquidation } from "../binance-account-api"

export function parseMarginLiquidation(
  row: BinanceMarginLiquidation,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const {
    avgPrice,
    executedQty,
    isIsolated,
    orderId,
    price,
    qty,
    side,
    symbol,
    timeInForce,
    updatedTime,
  } = row
  const wallet = isIsolated ? `Binance Isolated Margin` : `Binance Cross Margin`
  const timestamp = new Date(Number(updatedTime)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${updatedTime}`)
  }
  const txId = `${connection._id}_${orderId}_binance_${index}`
  const importId = connection._id
  const importIndex = index
  const outgoing = executedQty
  const outgoingN = parseFloat(outgoing)
  const outgoingAsset = `binance:${symbol}`
  const logs: AuditLog[] = [
    {
      _id: `${txId}_LOAN`,
      assetId: outgoingAsset,
      change: `-${outgoing}` as string,
      changeN: outgoingN as number,
      importId,
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
