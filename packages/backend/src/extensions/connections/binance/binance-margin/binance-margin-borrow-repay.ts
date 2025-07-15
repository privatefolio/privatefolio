import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult, ResolutionString } from "src/interfaces"
import { floorTimestamp } from "src/utils/utils"

import { BinanceMarginLoanRepayment } from "../binance-api"
import { BINANCE_WALLETS } from "../binance-settings"

export function parseLoan(
  row: BinanceMarginLoanRepayment,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { asset, isolatedSymbol, principal, txId: id } = row
  const wallet = isolatedSymbol ? BINANCE_WALLETS.isolatedMargin : BINANCE_WALLETS.crossMargin
  const timestamp = floorTimestamp(row.timestamp, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${row.timestamp}`)
  }
  const txId = `${connection.id}_${id}_binance`
  const importId = connection.id
  const importIndex = index

  const principalBN = new Big(principal)

  const incoming = principalBN.toString()
  const incomingAsset = `${platformId}:${asset}`
  const logs: AuditLog[] = [
    {
      assetId: incomingAsset,
      change: incoming as string,
      fileImportId: importId,
      id: `${txId}_LOAN`,
      importIndex,
      operation: "Margin Loan",
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
  const { amount, asset, isolatedSymbol, txId: id } = row
  const wallet = isolatedSymbol ? BINANCE_WALLETS.isolatedMargin : BINANCE_WALLETS.crossMargin
  const timestamp = floorTimestamp(row.timestamp, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${row.timestamp}`)
  }
  const txId = `${connection.id}_${id}_binance`
  const importId = connection.id
  const importIndex = index

  const amountBN = new Big(amount)
  const outgoing = amountBN.toString()
  const outgoingAsset = `${platformId}:${asset}`
  const logs: AuditLog[] = [
    {
      assetId: outgoingAsset,
      change: `-${outgoing}` as string,
      fileImportId: importId,
      id: `${txId}_Repayment`,
      importIndex,
      operation: "Margin Repayment",
      platformId,
      timestamp,
      wallet,
    },
  ]

  return {
    logs,
  }
}
