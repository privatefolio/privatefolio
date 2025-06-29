import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  BinanceConnection,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { asUTC } from "src/utils/formatting-utils"

import { BinanceWithdrawal } from "../binance-account-api"

export function parseWithdraw(
  row: BinanceWithdrawal,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { transactionFee, amount, coin, applyTime, txId: txHash } = row

  const wallet = `Binance Spot`
  if (amount === "0") {
    return { logs: [] }
  }
  const timestamp = asUTC(new Date(applyTime))
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${applyTime}`)
  }

  const assetId = `binance:${coin}`
  const txId = `${connection.id}_${txHash}_Binance_withdraw_${index}`
  const operation: AuditLogOperation = "Withdraw"
  const type: TransactionType = "Withdraw"
  const importId = connection.id
  const importIndex = index

  const amountBN = new Big(amount)
  const feeBN = new Big(transactionFee)

  const outgoing = amountBN.plus(feeBN).toFixed()
  const outgoingAsset = assetId
  const change = `-${outgoing}`
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
    incoming: undefined,
    incomingAsset: undefined,
    metadata: {
      txHash,
    },
    outgoing: outgoing === "0" ? undefined : outgoing,
    outgoingAsset: outgoing === "0" ? undefined : outgoingAsset,
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
