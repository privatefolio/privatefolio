import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  Connection,
  EtherscanTransaction,
  ParserResult,
  TransactionType,
} from "src/interfaces"

import { InternalTransaction } from "../etherscan-rpc"

export function parseInternal(
  row: InternalTransaction,
  index: number,
  connection: Connection
): ParserResult {
  const { platform, address } = connection
  //
  const {
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
  //
  const timestamp = new Date(Number(time) * 1000).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const wallet = address.toLowerCase()
  const txId = `${connection._id}_${txHash}_INTERNAL_${index}`
  const assetId = "ethereum:0x0000000000000000000000000000000000000000:ETH"
  const operation: AuditLogOperation = to?.toLowerCase() === wallet ? "Deposit" : "Withdraw"
  const type: TransactionType = operation

  let incoming: string | undefined, incomingAsset: string | undefined, incomingN: number | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined, outgoingN: number | undefined

  if (operation === "Deposit") {
    incoming = new Big(value).div(1e18).toFixed()
    incomingN = parseFloat(incoming)
    incomingAsset = assetId
  } else {
    outgoing = new Big(value).div(1e18).toFixed()
    outgoingN = parseFloat(outgoing)
    outgoingAsset = assetId
  }

  const logs: AuditLog[] = []

  const change = (operation === "Deposit" ? incoming : `-${outgoing}`) as string
  const changeN = parseFloat(change)

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

  // Fix for WETH: unwrapping does not appear in the erc20 export
  if (from === "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2") {
    logs.push({
      _id: `${txId}_WETH_${index}`,
      assetId: "ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2:WETH",
      change: `-${change}`,
      changeN: parseFloat(`-${change}`),
      importId: connection._id,
      importIndex: index + 0.1,
      operation: "Withdraw",
      platform,
      timestamp,
      txId,
      wallet,
    })
  }

  const tx: EtherscanTransaction = {
    _id: txId,
    contractAddress: contractAddress || undefined,
    importId: connection._id,
    importIndex: index,
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

  // Fix for WETH
  if (logs.length === 2) {
    tx.type = "Unwrap"
    tx.outgoingAsset = logs[1].assetId
    tx.outgoing = logs[0].change
    tx.outgoingN = logs[0].changeN
  }

  return {
    logs,
    txns: [tx],
  }
}
