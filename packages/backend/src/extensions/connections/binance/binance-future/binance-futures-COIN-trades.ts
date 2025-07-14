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

import { BinanceFuturesCOINTrades } from "../binance-account-api"
import { BINANCE_WALLET_LABELS } from "../binance-settings"

export function parseFuturesCOINTrade(
  row: BinanceFuturesCOINTrades,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { baseAsset, buyer, commission, commissionAsset, id, qty, baseQty, quoteAsset, time } = row
  const wallet = `Binance ${BINANCE_WALLET_LABELS.coinFutures}`
  const timestamp = floorTimestamp(time, "1S" as ResolutionString)
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
    incomingAsset = `${platformId}:${baseAsset}`
    outgoingBN = new Big(baseQty)
    outgoing = outgoingBN.toFixed()
    outgoingAsset = `${platformId}:${quoteAsset}`
    logs = [
      {
        assetId: outgoingAsset,
        change: `-${outgoing}` as string,
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
    incomingBN = new Big(baseQty)
    incoming = incomingBN.toFixed()
    incomingAsset = `${platformId}:${quoteAsset}`
    outgoingBN = new Big(qty)
    outgoing = outgoingBN.toFixed()
    outgoingAsset = `${platformId}:${baseAsset}`
    logs = [
      {
        assetId: outgoingAsset,
        change: `-${outgoing}` as string,
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
    const feeBN = new Big(commission)
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

  const priceBN = incomingBN.div(outgoingBN)
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
