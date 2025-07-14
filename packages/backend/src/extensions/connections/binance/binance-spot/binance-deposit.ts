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
  const { platformId } = connection
  const { amount, coin, insertTime, txId: txHash } = row

  const wallet = `Binance Spot`
  if (amount === "0") {
    return { logs: [] }
  }
  const timestamp = new Date(Number(insertTime)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${insertTime}`)
  }
  const assetId = `${platformId}:${coin}`
  const txId = `${connection.id}_${txHash}_Binance_deposit_${index}`
  const operation: AuditLogOperation = "Deposit"
  const type: TransactionType = "Deposit"
  const importId = connection.id
  const importIndex = index

  const amountBN = new Big(amount)
  const incoming = amountBN.toFixed()
  const incomingAsset = assetId

  const change = incoming
  const logs: AuditLog[] = [
    {
      assetId,
      change,
      fileImportId: importId,
      id: `${txId}_TRANSFER_${index}`,
      importIndex,
      operation,
      platformId,
      timestamp,
      txId,
      wallet,
    },
  ]

  const tx: Transaction = {
    fileImportId: importId,
    id: txId,
    importIndex,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    metadata: {
      txHash,
    },
    outgoing: undefined,
    outgoingAsset: undefined,
    platformId,
    timestamp,
    type,
    wallet,
  }

  return {
    logs,
    txns: [tx],
  }
}
