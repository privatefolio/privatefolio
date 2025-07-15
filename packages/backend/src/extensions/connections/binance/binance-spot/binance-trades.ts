import Big from "big.js"
import {
  AuditLog,
  BinanceConnection,
  ParserResult,
  ResolutionString,
  TransactionType,
} from "src/interfaces"
import { floorTimestamp, hashString } from "src/utils/utils"

import { BinanceTrade } from "../binance-api"

export function parseTrade(
  row: BinanceTrade,
  index: number,
  connection: BinanceConnection,
  wallet: string
): ParserResult {
  const { platformId } = connection
  const {
    id: binanceId,
    qty,
    commission,
    commissionAsset,
    time,
    isBuyer,
    baseAsset,
    quoteAsset,
    quoteQty,
  } = row

  const timestamp = floorTimestamp(time, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }

  const type: TransactionType = "Swap"
  const importId = connection.id
  const importIndex = index

  const quantityBN = new Big(qty)
  const quoteQuantityBN = new Big(quoteQty)
  // const price = Big(outgoing).div(Big(incoming)).toString()

  let incoming: string | undefined, incomingAsset: string | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined
  let feeAsset: string | undefined
  // let txId: string | undefined
  let logs: AuditLog[]

  if (isBuyer) {
    incoming = quantityBN.toString()
    incomingAsset = `${platformId}:${baseAsset}`
    outgoing = quoteQuantityBN.toString()
    outgoingAsset = `${platformId}:${quoteAsset}`
    // txId = `${connection.id}_${hashString(`${outgoingAsset}_${incomingAsset}_${price}`)}`
    logs = [
      {
        assetId: outgoingAsset,
        change: `-${outgoing}`,
        fileImportId: importId,
        id: `${connection.id}_${hashString(`${outgoingAsset}_Sell_-${outgoing}`)}`,
        importIndex,
        operation: "Sell",
        platformId,
        timestamp,
        // txId,
        wallet,
      },
      {
        assetId: incomingAsset,
        change: incoming,
        fileImportId: importId,
        id: `${connection.id}_${hashString(`${incomingAsset}_Buy_${incoming}`)}`,
        importIndex,
        operation: "Buy",
        platformId,
        timestamp,
        // txId,
        wallet,
      },
    ]
  } else {
    incoming = quoteQuantityBN.toString()
    incomingAsset = `${platformId}:${quoteAsset}`
    outgoing = quantityBN.toString()
    outgoingAsset = `${platformId}:${baseAsset}`
    // txId = `${connection.id}_${hashString(`${outgoingAsset}_${incomingAsset}_${price}`)}`
    logs = [
      {
        assetId: outgoingAsset,
        change: `-${outgoing}`,
        fileImportId: importId,
        id: `${connection.id}_${hashString(`${outgoingAsset}_Sell_-${outgoing}`)}`,
        importIndex,
        operation: "Sell",
        platformId,
        timestamp,
        // txId,
        wallet,
      },
      {
        assetId: incomingAsset,
        change: incoming,
        fileImportId: importId,
        id: `${connection.id}_${hashString(`${incomingAsset}_Buy_${incoming}`)}`,
        importIndex,
        operation: "Buy",
        platformId,
        timestamp,
        // txId,
        wallet,
      },
    ]
  }

  if (commission) {
    feeAsset = `${platformId}:${commissionAsset}`
    logs.push({
      assetId: feeAsset,
      change: `-${commission}`,
      fileImportId: importId,
      id: `${connection.id}_${hashString(`${feeAsset}_Fee_-${commission}`)}`,
      importIndex,
      operation: "Fee",
      platformId,
      timestamp,
      // txId,
      wallet,
    })
  }
  // const tx: Transaction = {
  //   fee: commission === "0" ? undefined : commission,
  //   feeAsset: commission === "0" ? undefined : feeAsset,
  //   fileImportId: importId,
  //   id: txId,
  //   importIndex,
  //   incoming: incoming === "0" ? undefined : incoming,
  //   incomingAsset: incoming === "0" ? undefined : incomingAsset,
  //   metadata: {},
  //   outgoing: outgoing === "0" ? undefined : outgoing,
  //   outgoingAsset: outgoing === "0" ? undefined : outgoingAsset,
  //   platformId,
  //   price: priceBN.toString(),
  //   timestamp,
  //   type,
  //   wallet,
  // }

  return {
    logs,
    // txns: [tx],
  }
}
