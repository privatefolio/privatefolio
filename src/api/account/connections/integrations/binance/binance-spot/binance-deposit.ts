import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  BinanceConnection,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"

import { BinanceDeposit } from "../binance-account-api"

export function parseDeposit(
  row: BinanceDeposit,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const { amount, coin, insertTime, txId: txHash } = row

  const wallet = `Binance Spot`
  if (amount === "0") {
    return { logs: [] }
  }
  const timestamp = new Date(Number(insertTime)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${insertTime}`)
  }
  const assetId = `binance:${coin}`
  const txId = `${connection._id}_${txHash}_Binance_deposit_${index}`
  const operation: AuditLogOperation = "Deposit"
  const type: TransactionType = "Deposit"
  const importId = connection._id
  const importIndex = index

  const amountBN = new Big(amount)
  const incoming = amountBN.toFixed()
  const incomingN = amountBN.toNumber()
  const incomingAsset = assetId

  const change = incoming
  const changeN = incomingN
  const logs: AuditLog[] = [
    {
      _id: `${txId}_TRANSFER_${index}`,
      assetId,
      change,
      changeN,
      importId,
      importIndex,
      operation,
      platform,
      timestamp,
      txId,
      wallet,
    },
  ]

  const tx: Transaction = {
    _id: txId,
    importId,
    importIndex,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    incomingN: incoming === "0" ? undefined : incomingN,
    outgoing: undefined,
    outgoingAsset: undefined,
    outgoingN: undefined,
    platform,
    timestamp,
    txHash,
    type,
    wallet,
  }

  return {
    logs,
    txns: [tx],
  }
}
