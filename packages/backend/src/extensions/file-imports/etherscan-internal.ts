import {
  AuditLog,
  AuditLogOperation,
  ParserRequirement,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { PLATFORMS_META, WETH_ASSET_ID } from "src/settings/settings"
import { formatAddress, getAssetContract } from "src/utils/assets-utils"
import { asUTC } from "src/utils/formatting-utils"

import { ETHEREUM_PLATFORM_ID } from "../utils/evm-utils"

export const extensionId = "etherscan-file-import"
export const parserId = "etherscan-internal-txns"

export const HEADERS = [
  '"Txhash","Blockno","UnixTimestamp","DateTime (UTC)","ParentTxFrom","ParentTxTo","ParentTxETH_Value","From","TxTo","ContractAddress","Value_IN(ETH)","Value_OUT(ETH)","CurrentValue","Historical $Price/Eth","Status","ErrCode","Type"',
  '"Transaction Hash","Blockno","UnixTimestamp","DateTime (UTC)","ParentTxFrom","ParentTxTo","ParentTxETH_Value","From","TxTo","ContractAddress","Value_IN(ETH)","Value_OUT(ETH)","CurrentValue","Historical $Price/Eth","Status","ErrCode","Type"',
]

export const requirements: ParserRequirement[] = [{ name: "platform", type: "platform" }]

export function parse(
  csvRow: string,
  index: number,
  fileImportId: string,
  parserContext: Record<string, unknown>
): ParserResult {
  const platformId = parserContext.platform as string
  if (!platformId) {
    throw new Error("'platform' is required for this type of file import")
  }
  const columns = csvRow
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map((column) => column.replaceAll('"', ""))
  //

  const txHash = columns[0]
  // const blockNumber = columns[1]
  // const unixTimestamp = columns[2]
  const datetimeUtc = columns[3]
  const parentTxFrom = formatAddress(columns[4])
  // const parentTxTo = columns[5]
  // const parentTxEthValue = columns[6]
  const from = formatAddress(columns[7])
  const txTo = formatAddress(columns[8])
  // const contractAddress = columns[9]
  const valueIn = columns[10].replaceAll(",", "")
  const valueOut = columns[11].replaceAll(",", "")
  // const ethCurrentValue = columns[12]
  // const ethHistoricalPrice = columns[13]
  // const status = columns[14]
  // const errorCode = columns[15]
  // const txType = columns[17].trim()
  //
  const txId = `${fileImportId}_${txHash}_INTERNAL_${index}`
  const timestamp = asUTC(new Date(datetimeUtc))

  const assetId = PLATFORMS_META[ETHEREUM_PLATFORM_ID].nativeAssetId as string
  const wallet = valueIn === "0" ? parentTxFrom : txTo

  const logs: AuditLog[] = []
  let type: TransactionType
  const operation: AuditLogOperation =
    valueOut === "0" && valueIn !== "0"
      ? "Deposit"
      : valueIn === "0" && valueOut === "0"
        ? "Smart Contract"
        : "Withdraw"

  if (operation === "Smart Contract") {
    type = "Unknown"
    // if (method === "Approve") type = "Approve" TODO4
  } else {
    type = operation
    const change = operation === "Deposit" ? valueIn : `-${valueOut}`

    logs.push({
      assetId,
      change,
      fileImportId,
      id: `${txId}_VALUE_${index}`,
      importIndex: index,
      operation,
      platformId,
      timestamp,
      txId,
      wallet,
    })

    // TESTME TODO9: on other networks
    // Fix for WETH: unwrapping does not appear in the erc20 export
    if (from === getAssetContract(WETH_ASSET_ID)) {
      logs.push({
        assetId: WETH_ASSET_ID,
        change: `-${valueIn}`,
        fileImportId,
        id: `${txId}_WETH_${index}`,
        importIndex: index + 0.1,
        operation: "Withdraw",
        platformId,
        timestamp,
        txId,
        wallet,
      })
    }
  }

  const tx: Transaction = {
    fileImportId,
    id: txId,
    importIndex: index,
    incoming: valueIn,
    incomingAsset: assetId,
    metadata: {
      txHash,
    },
    platformId,
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

  return { logs, txns: [tx] }
}
