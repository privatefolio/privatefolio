import {
  AuditLog,
  AuditLogOperation,
  ParserRequirement,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { PLATFORMS_META, WETH_ASSET_ID } from "src/settings/settings"
import { formatAddress, getAssetInternalId } from "src/utils/assets-utils"
import { extractColumnsFromRow } from "src/utils/csv-utils"
import { asUTC } from "src/utils/formatting-utils"

export const extensionId = "etherscan-file-import"
export const parserId = "etherscan-user-txns"

export const HEADERS = [
  '"Txhash","Blockno","UnixTimestamp","DateTime (UTC)","From","To","ContractAddress","Value_IN(ETH)","Value_OUT(ETH)","CurrentValue","TxnFee(ETH)","TxnFee(USD)","Historical $Price/Eth","Status","ErrCode","Method"',
  '"Transaction Hash","Blockno","UnixTimestamp","DateTime (UTC)","From","To","ContractAddress","Value_IN(ETH)","Value_OUT(ETH)","CurrentValue","TxnFee(ETH)","TxnFee(USD)","Historical $Price/Eth","Status","ErrCode","Method"',
]

export const requirements: ParserRequirement[] = [{ name: "platform", type: "platform" }]

export function parse(
  csvRow: string,
  index: number,
  fileImportId: string,
  parserContext: Record<string, unknown>
): ParserResult {
  // ----------------------------------------------------------------- Parse
  const platformId = parserContext.platform as string
  if (!platformId) {
    throw new Error("'platform' is required for this type of file import")
  }
  const columns = extractColumnsFromRow(csvRow, 16)
  //
  const txHash = columns[0]
  // const blockNumber = columns[1]
  // const unixTimestamp = columns[2]
  const datetimeUtc = columns[3]
  const from = formatAddress(columns[4])
  const to = formatAddress(columns[5])
  const contractAddress = columns[6]
  const incoming = columns[7].replaceAll(",", "") // valueIn
  const outgoing = columns[8].replaceAll(",", "") // valueOut
  // const ethCurrentValue = columns[9]
  const txnFee = columns[10].replaceAll(",", "")
  // const txnFeeUsd = columns[11]
  // const ethHistoricalPrice = columns[12]
  const status = columns[13]
  // const errorCode = columns[14]
  const method = columns[15].trim()
  // ----------------------------------------------------------------- Derive
  const timestamp = asUTC(new Date(datetimeUtc))
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${datetimeUtc}`)
  }
  const txId = `${fileImportId}_${txHash}_NORMAL_${index}`
  const assetId = PLATFORMS_META[platformId].nativeAssetId as string
  const wallet = incoming === "0" ? from : to
  const hasError = status === "Error(0)" || undefined // TODO2 statuses like Error(1) means only some internal txns failed
  //
  const logs: AuditLog[] = []
  let type: TransactionType
  const operation: AuditLogOperation =
    outgoing === "0" && incoming !== "0"
      ? "Deposit"
      : incoming === "0" && outgoing === "0"
        ? "Smart Contract"
        : "Withdraw"

  if (operation === "Smart Contract") {
    type = "Unknown"
    if (method === "Approve") type = "Approve"
  } else {
    type = operation
    if (!hasError) {
      const change = operation === "Deposit" ? incoming : `-${outgoing}`

      logs.push({
        assetId,
        change,
        fileImportId,
        id: `${txId}_VALUE_0`,
        importIndex: index,
        operation,
        platformId,
        timestamp,
        txId,
        wallet,
      })

      // TESTME TODO9: on other networks
      // Fix for WETH: wrapping does not appear
      if (operation === "Withdraw" && to === getAssetInternalId(WETH_ASSET_ID)) {
        logs[logs.length - 1].operation = "Wrap"
        logs.push({
          assetId: WETH_ASSET_ID,
          change: outgoing as string,
          fileImportId,
          id: `${txId}_WETH_${index}`,
          importIndex: index + 0.1,
          operation: "Mint",
          platformId,
          timestamp,
          txId,
          wallet,
        })
      }
    }
  }

  let fee: string | undefined, feeAsset: string | undefined

  if (txnFee !== "0" && incoming === "0") {
    fee = `-${txnFee}`
    feeAsset = assetId

    logs.push({
      assetId,
      change: fee,
      fileImportId,
      id: `${txId}_FEE_0`,
      importIndex: index + 0.1,
      operation: "Fee",
      platformId,
      timestamp,
      txId,
      wallet,
    })
  }

  const tx: Transaction = {
    fee,
    feeAsset,
    fileImportId,
    id: txId,
    importIndex: index,
    incoming: hasError || incoming === "0" ? undefined : incoming,
    incomingAsset: hasError || incoming === "0" ? undefined : assetId,
    metadata: {
      contractAddress: contractAddress || undefined,
      failed: hasError || undefined,
      method,
      txHash,
    },
    outgoing: hasError || outgoing === "0" ? undefined : outgoing,
    outgoingAsset: hasError || outgoing === "0" ? undefined : assetId,
    platformId,
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
