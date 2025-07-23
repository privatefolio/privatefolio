import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  BinanceConnection,
  ParserResult,
  ResolutionString,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { floorTimestamp, hashString } from "src/utils/utils"

import { BinanceDeposit } from "../binance-api"
import { BINANCE_WALLETS } from "../binance-settings"

export function parseDeposit(
  row: BinanceDeposit,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { amount, coin, insertTime, txId: txHash } = row

  const wallet = BINANCE_WALLETS.spot
  if (amount === "0") {
    return { logs: [] }
  }
  const timestamp = floorTimestamp(insertTime, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${insertTime}`)
  }
  const assetId = `${platformId}:${coin}`
  const operation: AuditLogOperation = "Deposit"
  const type: TransactionType = "Deposit"
  const importId = connection.id
  const importIndex = index

  const amountBN = new Big(amount)
  const incoming = amountBN.toFixed()
  const incomingAsset = assetId

  const change = incoming
  const id = `${connection.id}_${hashString(`${assetId}_${operation}_${change}`)}_${index}`
  const txId = `${id}_TX`

  const logs: AuditLog[] = [
    {
      assetId,
      change,
      fileImportId: importId,
      id: `${txId}_TRANSFER`,
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
