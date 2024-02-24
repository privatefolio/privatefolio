import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  Connection,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"

import { BlockRewardTransaction } from "../etherscan-rpc"

export function parseBlockReward(
  row: BlockRewardTransaction,
  index: number,
  connection: Connection
): ParserResult {
  // ----------------------------------------------------------------- Parse
  const { platform, address } = connection
  const { blockReward: amount, timeStamp: time, blockNumber } = row
  // ----------------------------------------------------------------- Derive
  const timestamp = new Date(Number(time) * 1000).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const wallet = address.toLowerCase()
  const txId = `${connection._id}_${wallet}+${blockNumber}_BLOCK_${index}`
  const assetId = "ethereum:0x0000000000000000000000000000000000000000:ETH"
  const operation: AuditLogOperation = "Reward"
  const type: TransactionType = operation

  const incoming = new Big(amount).div(1e18).toFixed()
  const incomingN = parseFloat(incoming)
  const incomingAsset = assetId

  const logs: AuditLog[] = []

  const change = incoming
  const changeN = incomingN

  logs.push({
    _id: `${txId}_VALUE_0`,
    assetId,
    change,
    changeN,
    importId: connection._id,
    importIndex: index,
    operation,
    platform,
    timestamp,
    txId,
    wallet,
  })

  const tx: Transaction = {
    _id: txId,
    importId: connection._id,
    importIndex: index,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    incomingN: incoming === "0" ? undefined : incomingN,
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
