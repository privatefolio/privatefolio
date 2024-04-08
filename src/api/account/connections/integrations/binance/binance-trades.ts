import {
  AuditLog,
  BinanceConnection,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"

import { BinanceTrade } from "./binance-account-api"

export function parseTrade(
  row: BinanceTrade,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform, address } = connection
  const { symbol, id, price, qty, quoteQty, commission, commissionAsset, time, isBuyer } = row

  const wallet = `Binance Spot`

  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection._id}_${id}_binance_${index}`
  const type: TransactionType = "Swap"
  const importId = connection._id
  const importIndex = index

  let incoming: string | undefined, incomingAsset: string | undefined, incomingN: number | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined, outgoingN: number | undefined
  let logs: AuditLog[]

  if (isBuyer) {
    incoming = qty
    incomingN = parseFloat(incoming)
    incomingAsset = `binance:${commissionAsset}`
    outgoing = quoteQty
    outgoingN = parseFloat(outgoing)
    outgoingAsset = `binance:${symbol.replace(commissionAsset, "")}`
    logs = [
      {
        _id: `${txId}_SELL`,
        assetId: outgoingAsset,
        change: `-${outgoing}` as string,
        changeN: parseFloat(outgoing),
        importId,
        importIndex,
        operation: "Sell",
        platform,
        timestamp,
        txId,
        wallet,
      },
      {
        _id: `${txId}_FEE`,
        assetId: `binance:${commissionAsset}`,
        change: `-${commission}` as string,
        changeN: parseFloat(commission),
        importId,
        importIndex,
        operation: "Fee",
        platform,
        timestamp,
        txId,
        wallet,
      },
      {
        _id: `${txId}_BUY`,
        assetId: incomingAsset,
        change: incoming,
        changeN: parseFloat(incoming),
        importId,
        importIndex,
        operation: "Buy",
        platform,
        timestamp,
        txId,
        wallet,
      },
    ]
  } else {
    incoming = quoteQty
    incomingN = parseFloat(incoming)
    incomingAsset = `binance:${commissionAsset}`
    outgoing = qty
    outgoingN = parseFloat(outgoing)
    outgoingAsset = `binance:${symbol.replace(commissionAsset, "")}`
    logs = [
      {
        _id: `${txId}_SELL`,
        assetId: outgoingAsset,
        change: `-${outgoing}` as string,
        changeN: parseFloat(outgoing),
        importId,
        importIndex,
        operation: "Sell",
        platform,
        timestamp,
        txId,
        wallet,
      },
      {
        _id: `${txId}_FEE`,
        assetId: `binance:${commissionAsset}`,
        change: `-${commission}` as string,
        changeN: parseFloat(commission),
        importId,
        importIndex,
        operation: "Fee",
        platform,
        timestamp,
        txId,
        wallet,
      },
      {
        _id: `${txId}_BUY`,
        assetId: incomingAsset,
        change: incoming,
        changeN: parseFloat(incoming),
        importId,
        importIndex,
        operation: "Buy",
        platform,
        timestamp,
        txId,
        wallet,
      },
    ]
  }

  const tx: Transaction = {
    _id: txId,
    fee: commission,
    feeAsset: `binance:${commissionAsset}`,
    feeN: parseFloat(commission),
    importId,
    importIndex,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    incomingN: incoming === "0" ? undefined : incomingN,
    outgoing: outgoing === "0" ? undefined : outgoing,
    outgoingAsset: outgoing === "0" ? undefined : outgoingAsset,
    outgoingN: outgoing === "0" ? undefined : outgoingN,
    platform,
    timestamp,
    type,
    wallet,
  }

  return {
    logs,
    txns: [tx],
  }
}
