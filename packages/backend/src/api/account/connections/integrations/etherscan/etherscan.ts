import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  EtherscanConnection,
  EtherscanTransaction,
  ParserResult,
  TransactionType,
} from "src/interfaces"
import { PLATFORMS_META, WETH_ASSET_ID } from "src/settings"
import { formatAddress, getAssetContract } from "src/utils/assets-utils"
import { extractMethodFromFunctionName } from "src/utils/integrations/etherscan-utils"

import { NormalTransaction } from "../etherscan-rpc"

export function parseNormal(
  row: NormalTransaction,
  index: number,
  connection: EtherscanConnection
): ParserResult {
  // ----------------------------------------------------------------- Parse
  const { platform, address } = connection
  let {
    to,
    value,
    hash: txHash,
    isError,
    gasUsed,
    timeStamp: time,
    contractAddress,
    from,
    functionName,
    methodId,
  } = row
  to = formatAddress(to)
  contractAddress = formatAddress(contractAddress)
  from = formatAddress(from)
  // ----------------------------------------------------------------- Derive
  const timestamp = new Date(Number(time) * 1000).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${txHash}_NORMAL_${index}`
  const assetId = PLATFORMS_META[platform].nativeAssetId as string
  const wallet = address
  const hasError = isError === "1" || undefined
  const method = extractMethodFromFunctionName(functionName || methodId)
  //
  const logs: AuditLog[] = []
  let type: TransactionType
  const operation: AuditLogOperation =
    value === "0" ? "Smart Contract" : to === wallet ? "Deposit" : "Withdraw"

  let incoming: string | undefined, incomingAsset: string | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined

  if (operation === "Smart Contract") {
    type = "Unknown"
    if (method === "Approve") type = "Approve"
  } else {
    type = operation
    if (!hasError) {
      if (operation === "Deposit") {
        incoming = new Big(value).div(1e18).toFixed()
        incomingAsset = assetId
      } else {
        outgoing = new Big(value).div(1e18).toFixed()
        outgoingAsset = assetId
      }
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
      // Fix for WETH: wrapping does not appear
      if (operation === "Withdraw" && to === getAssetContract(WETH_ASSET_ID)) {
        logs[logs.length - 1].operation = "Wrap"
        logs.push({
          assetId: WETH_ASSET_ID,
          change: outgoing as string,
          connectionId: connection.id,
          id: `${txId}_WETH_${index}`,
          importIndex: index + 0.1,
          operation: "Mint",
          platform,
          timestamp,
          txId,
          wallet,
        })
      }
    }
  }

  let fee: string | undefined, feeAsset: string | undefined, feeN: number | undefined

  if ("gasPrice" in row && from === wallet) {
    fee = new Big(gasUsed).mul(row.gasPrice).div(1e18).mul(-1).toFixed()
    feeAsset = assetId

    logs.push({
      assetId,
      change: fee,
      connectionId: connection.id,
      id: `${txId}_FEE_0`,
      importIndex: index + 0.1,
      operation: "Fee",
      platform,
      timestamp,
      txId,
      wallet,
    })
  }

  const tx: EtherscanTransaction = {
    connectionId: connection.id,
    fee,
    feeAsset,
    id: txId,
    importIndex: index,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    metadata: {
      contractAddress: contractAddress || undefined,
      failed: hasError || undefined,
      method,
      txHash,
    },
    outgoing: outgoing === "0" ? undefined : outgoing,
    outgoingAsset: outgoing === "0" ? undefined : outgoingAsset,
    platform,
    // price,
    // role,
    timestamp,
    type,
    wallet,
  }

  // TESTME TODO9: on other networks
  // Fix for WETH
  if (logs.length === 3) {
    tx.type = "Wrap"
    tx.incomingAsset = logs[1].assetId
    tx.incoming = logs[1].change
  }

  return { logs, txns: [tx] }
}
