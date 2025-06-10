import Big from "big.js"
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
  const { platform } = connection
  const {
    baseAsset,
    commission,
    commissionAsset,
    id,
    isBuyer,
    isIsolated,
    price,
    qty,
    quoteAsset,
    time,
  } = row

  const wallet = isIsolated ? `Binance Isolated Margin` : `Binance Cross Margin`
  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${id}_binance_${index}`
  const type: TransactionType = "Swap"
  const importId = connection.id
  const importIndex = index

  const feeBN = new Big(commission)
  const qtyBN = new Big(qty)
  const priceBN = new Big(price)
  const quoteQtyBN = qtyBN.times(priceBN)

  let incoming: string | undefined, incomingAsset: string | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined
  let logs: AuditLog[]

  if (isBuyer) {
    incoming = qtyBN.toFixed()
    incomingAsset = `binance:${baseAsset}`
    outgoing = quoteQtyBN.toFixed()
    outgoingAsset = `binance:${quoteAsset}`
    logs = [
      {
        assetId: outgoingAsset,
        change: `-${outgoing}`,
        fileImportId: importId,
        id: `${txId}_SELL`,
        importIndex,
        operation: "Sell",
        platform,
        timestamp,
        txId,
        wallet,
      },
      {
        assetId: incomingAsset,
        change: incoming,
        fileImportId: importId,
        id: `${txId}_BUY`,
        importIndex,
        operation: "Buy",
        platform,
        timestamp,
        txId,
        wallet,
      },
    ]
  } else {
    incoming = quoteQtyBN.toFixed()
    incomingAsset = `binance:${quoteAsset}`
    outgoing = qtyBN.toFixed()
    outgoingAsset = `binance:${baseAsset}`
    logs = [
      {
        assetId: outgoingAsset,
        change: `-${outgoing}`,
        fileImportId: importId,
        id: `${txId}_SELL`,
        importIndex,
        operation: "Sell",
        platform,
        timestamp,
        txId,
        wallet,
      },
      {
        assetId: incomingAsset,
        change: incoming,
        fileImportId: importId,
        id: `${txId}_BUY`,
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
      assetId: `binance:${commissionAsset}`,
      change: `-${feeBN.toFixed()}`,
      fileImportId: importId,
      id: `${txId}_FEE`,
      importIndex,
      operation: "Fee",
      platform,
      timestamp,
      txId,
      wallet,
    })
  }
  const tx: Transaction = {
    fee: commission === "0" ? undefined : commission,
    feeAsset: commission === "0" ? undefined : `binance:${commissionAsset}`,
    fileImportId: importId,
    id: txId,
    importIndex,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    metadata: {},
    outgoing: outgoing === "0" ? undefined : outgoing,
    outgoingAsset: outgoing === "0" ? undefined : outgoingAsset,
    platform,
    price: priceBN.toString(),
    timestamp,
    type,
    wallet,
  }

  return {
    logs,
    txns: [tx],
  }
}
