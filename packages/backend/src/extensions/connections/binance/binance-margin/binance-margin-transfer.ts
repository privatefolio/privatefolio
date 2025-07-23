import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult, ResolutionString } from "src/interfaces"
import { floorTimestamp, hashString } from "src/utils/utils"

import { BinanceMarginTransfer } from "../binance-api"
import { BINANCE_WALLETS } from "../binance-settings"

export function parseMarginTransfer(
  row: BinanceMarginTransfer,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { amount, asset, transFrom, transTo, txId: _txId } = row
  const timestamp = floorTimestamp(row.timestamp, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${row.timestamp}`)
  }
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
      id: `${connection.id}_${hashString(`${incomingAsset}_Transfer_${change}`)}_${index}`,
      importIndex,
      operation: "Transfer",
      platformId,
      timestamp,
      wallet:
        transTo === "ISOLATED_MARGIN"
          ? BINANCE_WALLETS.isolatedMargin
          : BINANCE_WALLETS.crossMargin,
    },
    {
      assetId: incomingAsset,
      change: `-${change}`,
      fileImportId: importId,
      id: `${connection.id}_${hashString(`${incomingAsset}_Transfer_-${change}`)}_${index}`,
      importIndex,
      operation: "Transfer",
      platformId,
      timestamp,
      wallet:
        transFrom === "ISOLATED_MARGIN"
          ? BINANCE_WALLETS.isolatedMargin
          : BINANCE_WALLETS.crossMargin,
    },
  ]
  return {
    logs,
  }
}
