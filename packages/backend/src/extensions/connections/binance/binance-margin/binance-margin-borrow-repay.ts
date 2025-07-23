import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult, ResolutionString } from "src/interfaces"
import { floorTimestamp, hashString } from "src/utils/utils"

import { BinanceMarginLoanRepayment } from "../binance-api"
import { BINANCE_WALLETS } from "../binance-settings"

export function parseLoan(
  row: BinanceMarginLoanRepayment,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { asset, isolatedSymbol, principal, txId: _txId } = row
  const wallet = isolatedSymbol ? BINANCE_WALLETS.isolatedMargin : BINANCE_WALLETS.crossMargin
  const timestamp = floorTimestamp(row.timestamp, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${row.timestamp}`)
  }
  const importId = connection.id
  const importIndex = index

  const principalBN = new Big(principal)

  const incoming = principalBN.toFixed()
  const incomingAsset = `${platformId}:${asset}`
  const operation = "Margin Loan"
  const id = `${connection.id}_${hashString(`${incomingAsset}_${operation}_${incoming}`)}_${index}`

  const logs: AuditLog[] = [
    {
      assetId: incomingAsset,
      change: incoming as string,
      fileImportId: importId,
      id,
      importIndex,
      operation,
      platformId,
      timestamp,
      wallet,
    },
  ]
  return {
    logs,
  }
}

export function parseRepayment(
  row: BinanceMarginLoanRepayment,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { amount, asset, isolatedSymbol, txId: _txId } = row
  const wallet = isolatedSymbol ? BINANCE_WALLETS.isolatedMargin : BINANCE_WALLETS.crossMargin
  const timestamp = floorTimestamp(row.timestamp, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${row.timestamp}`)
  }
  const assetId = `${platformId}:${asset}`
  const importId = connection.id
  const importIndex = index

  const change = `-${amount}`
  const operation = "Margin Repayment"
  const id = `${connection.id}_${hashString(`${assetId}_${operation}_${change}`)}_${index}`

  const logs: AuditLog[] = [
    {
      assetId,
      change,
      fileImportId: importId,
      id,
      importIndex,
      operation,
      platformId,
      timestamp,
      wallet,
    },
  ]

  return {
    logs,
  }
}
