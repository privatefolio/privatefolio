import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  EtherscanConnection,
  EtherscanTransaction,
  ParserResult,
  TransactionType,
} from "src/interfaces"
import { formatAddress } from "src/utils/assets-utils"
import { isSpamToken } from "src/utils/integrations/etherscan-utils"

import { Erc20Transaction } from "../etherscan-rpc"

export function parseERC20(
  row: Erc20Transaction,
  index: number,
  connection: EtherscanConnection
): ParserResult {
  // ----------------------------------------------------------------- Parse
  const { platform, address } = connection
  let {
    contractAddress,
    timeStamp: time,
    tokenSymbol: symbol,
    tokenDecimal,
    // from,
    to,
    value,
    hash: txHash,
  } = row
  contractAddress = formatAddress(contractAddress)
  to = formatAddress(to)
  // from = formatAddress(from)
  //
  if (value === "0") {
    return { logs: [] }
  }
  // ----------------------------------------------------------------- Derive
  const timestamp = new Date(Number(time) * 1000).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const assetId = `${platform}:${contractAddress}:${symbol}`
  if (isSpamToken(contractAddress, symbol)) {
    return { logs: [] }
  }
  const txId = `${connection.id}_${txHash}_ERC20_${index}`
  const wallet = address
  const operation: AuditLogOperation = to === wallet ? "Deposit" : "Withdraw"
  const type: TransactionType = operation
  const decimals = Number(tokenDecimal)
  const importId = connection.id
  const importIndex = index

  let incoming: string | undefined, incomingAsset: string | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined

  if (operation === "Deposit") {
    incoming = new Big(value).div(10 ** decimals).toFixed()
    incomingAsset = assetId
  } else {
    outgoing = new Big(value).div(10 ** decimals).toFixed()
    outgoingAsset = assetId
  }

  const change = (operation === "Deposit" ? incoming : `-${outgoing}`) as string

  const logs: AuditLog[] = [
    {
      assetId,
      change,
      connectionId: importId,
      id: `${txId}_TRANSFER_${index}`,
      importIndex,
      operation,
      platform,
      timestamp,
      txId,
      wallet,
    },
  ]

  const tx: EtherscanTransaction = {
    connectionId: importId,
    id: txId,
    importIndex,
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

  return {
    logs,
    txns: [tx],
  }
}
