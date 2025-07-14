import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult, ResolutionString } from "src/interfaces"
import { floorTimestamp } from "src/utils/utils"

import { BinanceMarginTransfer } from "../binance-account-api"

export function parseMarginTransfer(
  row: BinanceMarginTransfer,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { amount, asset, transFrom, transTo, txId: id } = row
  const timestamp = floorTimestamp(row.timestamp, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${row.timestamp}`) // TODO9
  }
  const txId = `${connection.id}_${id}_binance_${index}`
  const importId = connection.id
  const importIndex = index

  const changeBN = new Big(amount)
  const change = changeBN.toFixed()
  const incomingAsset = `${platformId}:${asset}`

  const logs: AuditLog[] = [
    {
      assetId: incomingAsset,
      change,
      fileImportId: importId,
      id: `${txId}_Transfer_From`,
      importIndex,
      operation: "Transfer",
      platformId,
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
      platformId,
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
