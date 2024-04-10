import {
  AuditLog,
  AuditLogOperation,
  BinanceConnection,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { asUTC } from "src/utils/formatting-utils"

import { BinanceWithdraw } from "./binance-account-api"

export function parseWithdraw(
  row: BinanceWithdraw,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform, address } = connection
  const {
    address: depositAddres,
    transactionFee,
    amount,
    coin,
    applyTime,
    network,
    transferType,
    walletType,
    completeTime,
    txId: txHash,
  } = row

  const wallet = `Binance Spot`
  if (amount === "0") {
    return { logs: [] }
  }
  const timestamp = asUTC(new Date(completeTime))
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${completeTime}`)
  }

  const assetId = `binance:${coin}`
  const txId = `${connection._id}_${txHash}_Binance_withdraw_${index}`
  const operation: AuditLogOperation = "Withdraw"
  const type: TransactionType = "Withdraw"
  const importId = connection._id
  const importIndex = index

  let incoming: string | undefined, incomingAsset: string | undefined, incomingN: number | undefined

  const outgoing = (parseFloat(amount) + parseFloat(transactionFee)).toString()
  const outgoingN = parseFloat(outgoing)
  const outgoingAsset = assetId
  const change = `-${outgoing}` as string
  const changeN = parseFloat(change)
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
