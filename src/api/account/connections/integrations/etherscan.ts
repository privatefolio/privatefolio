import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  Connection,
  EtherscanTransaction,
  ParserResult,
  TransactionType,
} from "src/interfaces"
import { extractMethodFromFunctionName } from "src/utils/integrations/etherscan-utils"

import { NormalTransaction } from "../etherscan-rpc"

export function parseNormal(
  row: NormalTransaction,
  index: number,
  connection: Connection
): ParserResult {
  // ----------------------------------------------------------------- Parse
  const { platform, address } = connection
  const {
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
  // ----------------------------------------------------------------- Derive
  const timestamp = new Date(Number(time) * 1000).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection._id}_${txHash}_NORMAL_${index}`
  const assetId = "ethereum:0x0000000000000000000000000000000000000000:ETH"
  const wallet = address.toLowerCase()
  const hasError = isError === "1" || undefined
  const method = extractMethodFromFunctionName(functionName || methodId)
  //
  const logs: AuditLog[] = []
  let type: TransactionType
  const operation: AuditLogOperation =
    value === "0" ? "Smart Contract" : to?.toLowerCase() === wallet ? "Deposit" : "Withdraw"

  let incoming: string | undefined, incomingAsset: string | undefined, incomingN: number | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined, outgoingN: number | undefined

  if (operation === "Smart Contract") {
    type = "Unknown"
  } else {
    type = operation
    if (!hasError) {
      if (operation === "Deposit") {
        incoming = new Big(value).div(1e18).toFixed()
        incomingN = parseFloat(incoming)
        incomingAsset = assetId
      } else {
        outgoing = new Big(value).div(1e18).toFixed()
        outgoingN = parseFloat(outgoing)
        outgoingAsset = assetId
      }
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
    }
  }

  let fee: string | undefined, feeAsset: string | undefined, feeN: number | undefined

  if ("gasPrice" in row && from?.toLowerCase() === wallet) {
    fee = new Big(gasUsed).mul(row.gasPrice).div(1e18).mul(-1).toFixed()
    feeN = parseFloat(fee)
    feeAsset = assetId

    logs.push({
      _id: `${txId}_FEE_0`,
      assetId,
      change: fee,
      changeN: feeN,
      importId: connection._id,
      importIndex: index + 0.1,
      operation: "Fee",
      platform,
      timestamp,
      txId,
      wallet,
    })
  }

  const tx: EtherscanTransaction = {
    _id: txId,
    contractAddress: contractAddress || undefined,
    failed: hasError || undefined,
    fee,
    feeAsset,
    feeN,
    importId: connection._id,
    importIndex: index,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    incomingN: incoming === "0" ? undefined : incomingN,
    method,
    outgoing: outgoing === "0" ? undefined : outgoing,
    outgoingAsset: outgoing === "0" ? undefined : outgoingAsset,
    outgoingN: outgoing === "0" ? undefined : outgoingN,
    platform,
    // price,
    // priceN,
    // role,
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