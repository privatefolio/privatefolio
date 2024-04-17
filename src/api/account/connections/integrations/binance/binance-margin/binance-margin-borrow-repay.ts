import { AuditLog, BinanceConnection, ParserResult } from "src/interfaces"

import { BinanceMarginLoanRepayment } from "../binance-account-api"

export function parseLoan(
  row: BinanceMarginLoanRepayment,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const {
    amount,
    asset,
    interest,
    isolatedSymbol,
    principal,
    status,
    timestamp: time,
    txId: id,
  } = row
  const wallet = isolatedSymbol ? `Binance Isolated Margin` : `Binance Cross Margin`
  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection._id}_${id}_binance_${index}`
  const importId = connection._id
  const importIndex = index
  const incoming = principal
  const incomingN = parseFloat(incoming)
  const incomingAsset = `binance:${asset}`
  const logs: AuditLog[] = [
    {
      _id: `${txId}_LOAN`,
      assetId: incomingAsset,
      change: incoming as string,
      changeN: incomingN as number,
      importId,
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
  const {
    amount,
    asset,
    interest,
    isolatedSymbol,
    principal,
    status,
    timestamp: time,
    txId: id,
  } = row
  const wallet = isolatedSymbol ? `Binance isolated margin` : `Binance cross margin`
  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection._id}_${id}_binance_${index}`
  const importId = connection._id
  const importIndex = index
  const outgoing = amount
  const outgoingN = parseFloat(outgoing)
  const outgoingAsset = `binance:${asset}`
  const logs: AuditLog[] = [
    {
      _id: `${txId}_Repayment`,
      assetId: outgoingAsset,
      change: `-${outgoing}` as string,
      changeN: outgoingN,
      importId,
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
