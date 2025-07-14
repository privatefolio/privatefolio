import Big from "big.js"
import {
  AuditLog,
  BinanceConnection,
  ParserResult,
  ResolutionString,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { floorTimestamp } from "src/utils/utils"

import { BinanceMarginTrade } from "../binance-account-api"

export function parseMarginTrade(
  row: BinanceMarginTrade,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
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
  const timestamp = floorTimestamp(time, "1S" as ResolutionString)
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
    incomingAsset = `${platformId}:${baseAsset}`
    outgoing = quoteQtyBN.toFixed()
    outgoingAsset = `${platformId}:${quoteAsset}`
    logs = [
      {
        assetId: outgoingAsset,
        change: `-${outgoing}`,
        fileImportId: importId,
        id: `${txId}_SELL`,
        importIndex,
        operation: "Sell",
        platformId,
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
        platformId,
        timestamp,
        txId,
        wallet,
      },
    ]
  } else {
    incoming = quoteQtyBN.toFixed()
    incomingAsset = `${platformId}:${quoteAsset}`
    outgoing = qtyBN.toFixed()
    outgoingAsset = `${platformId}:${baseAsset}`
    logs = [
      {
        assetId: outgoingAsset,
        change: `-${outgoing}`,
        fileImportId: importId,
        id: `${txId}_SELL`,
        importIndex,
        operation: "Sell",
        platformId,
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
        platformId,
        timestamp,
        txId,
        wallet,
      },
    ]
  }

  if (commission) {
    logs.push({
      assetId: `${platformId}:${commissionAsset}`,
      change: `-${feeBN.toFixed()}`,
      fileImportId: importId,
      id: `${txId}_FEE`,
      importIndex,
      operation: "Fee",
      platformId,
      timestamp,
      txId,
      wallet,
    })
  }
  const tx: Transaction = {
    fee: commission === "0" ? undefined : commission,
    feeAsset: commission === "0" ? undefined : `${platformId}:${commissionAsset}`,
    fileImportId: importId,
    id: txId,
    importIndex,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    metadata: {},
    outgoing: outgoing === "0" ? undefined : outgoing,
    outgoingAsset: outgoing === "0" ? undefined : outgoingAsset,
    platformId,
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
