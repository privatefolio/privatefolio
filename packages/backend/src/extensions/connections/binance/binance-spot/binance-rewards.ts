import Big from "big.js"
import {
  AuditLog,
  BinanceConnection,
  ParserResult,
  ResolutionString,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { floorTimestamp } from "src/utils/utils"

import { BinanceReward } from "../binance-account-api"

export function parseReward(
  row: BinanceReward,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { amount, rewards, asset, positionId, projectId, time } = row
  const wallet = `Binance Spot`
  const timestamp = floorTimestamp(time, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${positionId || projectId}_binance_${index}`
  const type: TransactionType = "Reward"
  const importId = connection.id
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
  const incomingAsset = `${platformId}:${asset}`
  const logs: AuditLog[] = [
    {
      assetId: incomingAsset,
      change: incoming as string,
      fileImportId: importId,
      id: `${txId}_REWARD`,
      importIndex,
      operation: "Reward",
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
    incoming,
    incomingAsset,
    metadata: {},
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
