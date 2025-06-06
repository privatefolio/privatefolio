import Big from "big.js"
import {
  AuditLog,
  BinanceConnection,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"

import { BinanceFuturesUSDTrades } from "../binance-account-api"

export function parseFuturesUSDTrade(
  row: BinanceFuturesUSDTrades,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const { baseAsset, buyer, commission, commissionAsset, id, qty, quoteQty, quoteAsset, time } = row
  const wallet = `Binance USD-M Futures`
  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${id}_binance_${index}`
  const type: TransactionType = "Swap"
  const importId = connection.id
  const importIndex = index

  let incoming: string | undefined, incomingAsset: string | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined
  let incomingBN: Big | undefined, outgoingBN: Big | undefined
  let logs: AuditLog[]

  if (buyer) {
    incomingBN = new Big(qty)
    incoming = incomingBN.toFixed()
    incomingAsset = `binance:${baseAsset}`
    outgoingBN = new Big(quoteQty)
    outgoing = outgoingBN.toFixed()
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
    incomingBN = new Big(quoteQty)
    incoming = incomingBN.toFixed()
    incomingAsset = `binance:${quoteAsset}`
    outgoingBN = new Big(qty)
    outgoing = outgoingBN.toFixed()
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
    const feeBN = new Big(commission)
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

  const priceBN = incomingBN.div(outgoingBN)
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
    price: priceBN.toFixed(),
    timestamp,
    type,
    wallet,
  }

  return {
    logs,
    txns: [tx],
  }
}
