import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult, ResolutionString } from "src/interfaces"
import { floorTimestamp } from "src/utils/utils"

import { BinanceMarginLoanRepayment } from "../binance-account-api"

export function parseLoan(
  row: BinanceMarginLoanRepayment,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { asset, isolatedSymbol, principal, time, txId: id } = row
  const wallet = isolatedSymbol ? `Binance Isolated Margin` : `Binance Cross Margin`
  const timestamp = floorTimestamp(time, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${id}_binance_${index}`
  const importId = connection.id
  const importIndex = index

  const principalBN = new Big(principal)

  const incoming = principalBN.toFixed()
  const incomingAsset = `${platformId}:${asset}`
  const logs: AuditLog[] = [
    {
      assetId: incomingAsset,
      change: incoming as string,
      fileImportId: importId,
      id: `${txId}_LOAN`,
      importIndex,
      operation: "Loan",
      platformId,
      timestamp,
      txId,
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
  const { amount, asset, isolatedSymbol, time, txId: id } = row
  const wallet = isolatedSymbol ? `Binance isolated margin` : `Binance cross margin`
  const timestamp = floorTimestamp(time, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${id}_binance_${index}`
  const importId = connection.id
  const importIndex = index

  const amountBN = new Big(amount)
  const outgoing = amountBN.toFixed()
  const outgoingAsset = `${platformId}:${asset}`
  const logs: AuditLog[] = [
    {
      assetId: outgoingAsset,
      change: `-${outgoing}` as string,
      fileImportId: importId,
      id: `${txId}_Repayment`,
      importIndex,
      operation: "Loan Repayment",
      platformId,
      timestamp,
      txId,
      wallet,
    },
  ]

  return {
    logs,
  }
}
