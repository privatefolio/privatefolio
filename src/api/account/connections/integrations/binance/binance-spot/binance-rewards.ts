import Big from "big.js"
import {
  AuditLog,
  BinanceConnection,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"

import { BinanceReward } from "../binance-account-api"

export function parseReward(
  row: BinanceReward,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const { amount, rewards, asset, positionId, projectId, time } = row
  const wallet = `Binance Spot`
  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection._id}_${positionId || projectId}_binance_${index}`
  const type: TransactionType = "Reward"
  const importId = connection._id
  const importIndex = index

  let amountBN: Big
  if (amount) {
    amountBN = new Big(amount)
  } else if (rewards) {
    amountBN = new Big(rewards)
  } else {
    throw new Error("This should never happen.")
  }

  const incoming = amountBN.toFixed()
  const incomingN = amountBN.toNumber()
  const incomingAsset = `binance:${asset}`
  const logs: AuditLog[] = [
    {
      _id: `${txId}_REWARD`,
      assetId: incomingAsset,
      change: incoming as string,
      changeN: incomingN as number,
      importId,
      importIndex,
      operation: "Reward",
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
    incoming,
    incomingAsset,
    incomingN,
    outgoing: undefined,
    outgoingAsset: undefined,
    outgoingN: undefined,
    platform,
    timestamp,
    type,
    wallet,
  }
  return {
    logs,
    txns: [tx],
  }
}
