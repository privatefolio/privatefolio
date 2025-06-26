import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  EtherscanConnection,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { PLATFORMS_META } from "src/settings/settings"

import { BlockRewardTransaction } from "./etherscan-rpc"

export function parseBlockReward(
  row: BlockRewardTransaction,
  index: number,
  connection: EtherscanConnection
): ParserResult {
  // ----------------------------------------------------------------- Parse
  const { platformId, address } = connection
  const { blockReward: amount, timeStamp: time, blockNumber } = row
  // ----------------------------------------------------------------- Derive
  const timestamp = new Date(Number(time) * 1000).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const wallet = address
  const txId = `${connection.id}_${wallet}+${blockNumber}_BLOCK_${index}`
  const assetId = PLATFORMS_META[platformId].nativeAssetId as string
  const operation: AuditLogOperation = "Reward"
  const type: TransactionType = operation

  const incoming = new Big(amount).div(1e18).toFixed()
  const incomingAsset = assetId

  const logs: AuditLog[] = []

  const change = incoming

  logs.push({
    assetId,
    change,
    connectionId: connection.id,
    id: `${txId}_VALUE_0`,
    importIndex: index,
    operation,
    platformId,
    timestamp,
    txId,
    wallet,
  })

  const tx: Transaction = {
    connectionId: connection.id,
    id: txId,
    importIndex: index,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    metadata: {},
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
