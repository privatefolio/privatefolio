import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  EtherscanConnection,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { PLATFORMS_META } from "src/settings"

import { StakingWithdrawalTransaction } from "../etherscan-rpc"

export function parseStakingWithdrawal(
  row: StakingWithdrawalTransaction,
  index: number,
  connection: EtherscanConnection
): ParserResult {
  // ----------------------------------------------------------------- Parse
  const { platform, address } = connection
  const {
    amount: amountInGwei,
    timestamp: time,
    // blockNumber
    validatorIndex,
    withdrawalIndex,
  } = row
  // ----------------------------------------------------------------- Derive
  const timestamp = new Date(Number(time) * 1000).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const wallet = address.toLowerCase()
  const txId = `${connection._id}_${validatorIndex}+${withdrawalIndex}_BEACON_${index}`
  const assetId = PLATFORMS_META.ethereum.nativeAssetId as string
  const operation: AuditLogOperation = "Deposit"
  const type: TransactionType = operation

  const incoming = new Big(amountInGwei).div(1e9).toFixed()
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
