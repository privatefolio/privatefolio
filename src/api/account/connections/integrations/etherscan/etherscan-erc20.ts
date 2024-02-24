import Big from "big.js"
import spamTokens from "src/config/spam-tokens.json"
import {
  AuditLog,
  AuditLogOperation,
  Connection,
  EtherscanTransaction,
  ParserResult,
  TransactionType,
} from "src/interfaces"

import { Erc20Transaction } from "../etherscan-rpc"

export function parseERC20(
  row: Erc20Transaction,
  index: number,
  connection: Connection
): ParserResult {
  // ----------------------------------------------------------------- Parse
  const { platform, address } = connection
  const {
    contractAddress,
    timeStamp: time,
    tokenSymbol: symbol,
    tokenDecimal,
    to,
    value,
    hash: txHash,
  } = row
  //
  if (value === "0") {
    return { logs: [] }
  }
  if (contractAddress in spamTokens || symbol.includes("http")) {
    return { logs: [] }
  }
  // ----------------------------------------------------------------- Derive
  const timestamp = new Date(Number(time) * 1000).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection._id}_${txHash}_ERC20_${index}`
  const wallet = address.toLowerCase()
  const operation: AuditLogOperation = to?.toLowerCase() === wallet ? "Deposit" : "Withdraw"
  const type: TransactionType = operation
  const assetId = `ethereum:${contractAddress}:${symbol}`
  const decimals = Number(tokenDecimal)
  const importId = connection._id
  const importIndex = index

  let incoming: string | undefined, incomingAsset: string | undefined, incomingN: number | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined, outgoingN: number | undefined

  if (operation === "Deposit") {
    incoming = new Big(value).div(10 ** decimals).toFixed()
    incomingN = parseFloat(incoming)
    incomingAsset = assetId
  } else {
    outgoing = new Big(value).div(10 ** decimals).toFixed()
    outgoingN = parseFloat(outgoing)
    outgoingAsset = assetId
  }

  const change = (operation === "Deposit" ? incoming : `-${outgoing}`) as string
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

  const tx: EtherscanTransaction = {
    _id: txId,
    contractAddress: contractAddress || undefined,
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
