import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult } from "src/interfaces"

import { BinanceMarginTransfer } from "../binance-account-api"

export function parseMarginTransfer(
  row: BinanceMarginTransfer,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const { amount, asset, timestamp: time, transFrom, transTo, txId: id } = row
  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${id}_binance_${index}`
  const importId = connection.id
  const importIndex = index

  const changeBN = new Big(amount)
  const change = changeBN.toFixed()
  const incomingAsset = `binance:${asset}`

  const logs: AuditLog[] = [
    {
      assetId: incomingAsset,
      change,
      fileImportId: importId,
      id: `${txId}_Transfer_From`,
      importIndex,
      operation: "Transfer",
      platform,
      timestamp,
      txId,
      wallet: `Binance ${(transFrom.charAt(0) + transFrom.substring(1).toLowerCase()).replace(
        "_",
        " "
      )}`,
    },
    {
      assetId: incomingAsset,
      change: `-${change}`,
      fileImportId: importId,
      id: `${txId}_Transfer_To`,
      importIndex,
      operation: "Transfer",
      platform,
      timestamp,
      txId,
      wallet: `Binance ${(transTo.charAt(0) + transTo.substring(1).toLowerCase()).replace(
        "_",
        " "
      )}`,
    },
  ]
  return {
    logs,
  }
}
