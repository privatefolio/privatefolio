import Big from "big.js"
import {
  AuditLog,
  BinanceConnection,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"

import { BinanceTrade } from "../binance-account-api"

export function parseTrade(
  row: BinanceTrade,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const { id, qty, quoteQty, commission, commissionAsset, time, isBuyer, baseAsset, quoteAsset } =
    row
  const wallet = `Binance Spot`

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
  const quoteQtyBN = new Big(quoteQty)

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
  const price = Big(incoming).div(Big(outgoing)).toString()
  const tx: Transaction = {
    fee: commission === "0" ? undefined : feeBN.toFixed(),
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
    price,
    timestamp,
    type,
    wallet,
  }

  return {
    logs,
    txns: [tx],
  }
}
