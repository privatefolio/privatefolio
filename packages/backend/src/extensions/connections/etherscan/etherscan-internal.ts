import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  EtherscanConnection,
  EtherscanTransaction,
  ParserResult,
  TransactionType,
} from "src/interfaces"
import { PLATFORMS_META, WETH_ASSET_ID } from "src/settings/settings"
import { formatAddress, getAssetContract } from "src/utils/assets-utils"

import { InternalTransaction } from "./etherscan-rpc"

export function parseInternal(
  row: InternalTransaction,
  index: number,
  connection: EtherscanConnection
): ParserResult {
  const { platform, address } = connection
  //
  let {
    to,
    value,
    hash: txHash,
    // isError,
    // gasUsed,
    timeStamp: time,
    // blockNumber,
    contractAddress,
    from,
    // gas,
    // input,
  } = row
  to = formatAddress(to)
  contractAddress = formatAddress(contractAddress)
  from = formatAddress(from)
  //
  const timestamp = new Date(Number(time) * 1000).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const wallet = address
  const txId = `${connection.id}_${txHash}_INTERNAL_${index}`
  const assetId = PLATFORMS_META[platform].nativeAssetId as string
  const operation: AuditLogOperation = to === wallet ? "Deposit" : "Withdraw"
  const type: TransactionType = operation

  let incoming: string | undefined, incomingAsset: string | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined

  if (operation === "Deposit") {
    incoming = new Big(value).div(1e18).toFixed()
    incomingAsset = assetId
  } else {
    outgoing = new Big(value).div(1e18).toFixed()
    outgoingAsset = assetId
  }

  const logs: AuditLog[] = []

  const change = (operation === "Deposit" ? incoming : `-${outgoing}`) as string

  logs.push({
    assetId,
    change,
    connectionId: connection.id,
    id: `${txId}_VALUE_0`,
    importIndex: index,
    operation,
    platform,
    timestamp,
    txId,
    wallet,
  })

  // TESTME TODO9: on other networks
  // Fix for WETH: unwrapping does not appear in the erc20 export
  if (from === getAssetContract(WETH_ASSET_ID)) {
    logs.push({
      assetId: WETH_ASSET_ID,
      change: `-${change}`,
      connectionId: connection.id,
      id: `${txId}_WETH_${index}`,
      importIndex: index + 0.1,
      operation: "Withdraw",
      platform,
      timestamp,
      txId,
      wallet,
    })
  }

  const tx: EtherscanTransaction = {
    connectionId: connection.id,
    id: txId,
    importIndex: index,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    metadata: {
      contractAddress: contractAddress || undefined,
      txHash,
    },
    outgoing: outgoing === "0" ? undefined : outgoing,
    outgoingAsset: outgoing === "0" ? undefined : outgoingAsset,
    platform,
    timestamp,
    type,
    wallet,
  }

  // Fix for WETH
  if (logs.length === 2) {
    tx.type = "Unwrap"
    tx.outgoingAsset = logs[1].assetId
    tx.outgoing = logs[0].change
  }

  return {
    logs,
    txns: [tx],
  }
}
