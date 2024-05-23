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

import { BinanceWithdraw } from "../binance-account-api"

export function parseWithdraw(
  row: BinanceWithdraw,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const { address, transactionFee, amount, coin, completeTime, applyTime, txId: txHash } = row

  const wallet = `Binance Spot`
  if (amount === "0") {
    return { logs: [] }
  }
  const timestamp = asUTC(new Date(applyTime))
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${applyTime}`)
  }

  const assetId = `binance:${coin}`
  const txId = `${connection._id}_${txHash}_Binance_withdraw_${index}`
  const operation: AuditLogOperation = "Withdraw"
  const type: TransactionType = "Withdraw"
  const importId = connection._id
  const importIndex = index

  const amountBN = new Big(amount)
  const feeBN = new Big(transactionFee)

  const outgoing = amountBN.plus(feeBN).toFixed()
  const outgoingN = amountBN.plus(feeBN).toNumber()
  const outgoingAsset = assetId
  const change = `-${outgoing}`
  const changeN = -outgoingN
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
    incoming: undefined,
    incomingAsset: undefined,
    incomingN: undefined,
    outgoing: outgoing === "0" ? undefined : outgoing,
    outgoingAsset: outgoing === "0" ? undefined : outgoingAsset,
    outgoingN: outgoing === "0" ? undefined : outgoingN,
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
