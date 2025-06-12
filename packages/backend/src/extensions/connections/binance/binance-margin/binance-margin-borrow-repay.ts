import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult } from "src/interfaces"

import { BinanceMarginLoanRepayment } from "../binance-account-api"

export function parseLoan(
  row: BinanceMarginLoanRepayment,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const { asset, isolatedSymbol, principal, timestamp: time, txId: id } = row
  const wallet = isolatedSymbol ? `Binance Isolated Margin` : `Binance Cross Margin`
  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${id}_binance_${index}`
  const importId = connection.id
  const importIndex = index

  const principalBN = new Big(principal)

  const incoming = principalBN.toFixed()
  const incomingAsset = `binance:${asset}`
  const logs: AuditLog[] = [
    {
      assetId: incomingAsset,
      change: incoming as string,
      fileImportId: importId,
      id: `${txId}_LOAN`,
      importIndex,
      operation: "Loan",
      platform,
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
  const { platform } = connection
  const { amount, asset, isolatedSymbol, timestamp: time, txId: id } = row
  const wallet = isolatedSymbol ? `Binance isolated margin` : `Binance cross margin`
  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${id}_binance_${index}`
  const importId = connection.id
  const importIndex = index

  const amountBN = new Big(amount)
  const outgoing = amountBN.toFixed()
  const outgoingAsset = `binance:${asset}`
  const logs: AuditLog[] = [
    {
      assetId: outgoingAsset,
      change: `-${outgoing}` as string,
      fileImportId: importId,
      id: `${txId}_Repayment`,
      importIndex,
      operation: "Loan Repayment",
      platform,
      timestamp,
      txId,
      wallet,
    },
  ]

  return {
    logs,
  }
}
