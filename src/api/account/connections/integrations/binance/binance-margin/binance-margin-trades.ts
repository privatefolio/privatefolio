import {
  AuditLog,
  BinanceConnection,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"

import { BinanceMarginTrade } from "../binance-account-api"

export function parseMarginTrade(
  row: BinanceMarginTrade,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform, address } = connection
  const {
    baseAsset,
    commission,
    commissionAsset,
    id,
    isBestMatch,
    isBuyer,
    isIsolated,
    isMaker,
    orderId,
    price,
    qty,
    quoteAsset,
    symbol,
    time,
  } = row

  const wallet = isIsolated ? `Binance Isolated Margin` : `Binance Cross Margin`
  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection._id}_${id}_binance_${index}`
  const type: TransactionType = "Swap"
  const importId = connection._id
  const importIndex = index
  const quoteQty = (parseFloat(qty) * parseFloat(price)).toString()

  let incoming: string | undefined, incomingAsset: string | undefined, incomingN: number | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined, outgoingN: number | undefined
  let logs: AuditLog[]

  if (isBuyer) {
    incoming = qty
    incomingN = parseFloat(incoming)
    incomingAsset = `binance:${baseAsset}`
    outgoing = quoteQty
    outgoingN = parseFloat(outgoing)
    outgoingAsset = `binance:${quoteAsset}`
    logs = [
      {
        _id: `${txId}_SELL`,
        assetId: outgoingAsset,
        change: `-${outgoing}` as string,
        changeN: outgoingN,
        importId,
        importIndex,
        operation: "Sell",
        platform,
        timestamp,
        txId,
        wallet,
      },
      {
        _id: `${txId}_BUY`,
        assetId: incomingAsset,
        change: incoming,
        changeN: incomingN,
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
    incomingAsset = `binance:${quoteAsset}`
    outgoing = qty
    outgoingN = parseFloat(outgoing)
    outgoingAsset = `binance:${baseAsset}`
    logs = [
      {
        _id: `${txId}_SELL`,
        assetId: outgoingAsset,
        change: `-${outgoing}` as string,
        changeN: outgoingN,
        importId,
        importIndex,
        operation: "Sell",
        platform,
        timestamp,
        txId,
        wallet,
      },
      {
        _id: `${txId}_BUY`,
        assetId: incomingAsset,
        change: incoming,
        changeN: incomingN,
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

  if (commission) {
    logs.push({
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
    })
  }
  const tx: Transaction = {
    _id: txId,
    fee: commission === "0" ? undefined : commission,
    feeAsset: commission === "0" ? undefined : `binance:${commissionAsset}`,
    feeN: commission === "0" ? undefined : parseFloat(commission),
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
