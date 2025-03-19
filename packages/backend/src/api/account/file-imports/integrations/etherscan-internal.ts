import {
  AuditLog,
  AuditLogOperation,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { PlatformId, PLATFORMS_META, WETH_ASSET_ID } from "src/settings"
import { formatAddress, getAssetContract } from "src/utils/assets-utils"
import { asUTC } from "src/utils/formatting-utils"

export const Identifier = "etherscan-internal"
export const platform: PlatformId = "ethereum"

export const HEADERS = [
  '"Txhash","Blockno","UnixTimestamp","DateTime (UTC)","ParentTxFrom","ParentTxTo","ParentTxETH_Value","From","TxTo","ContractAddress","Value_IN(ETH)","Value_OUT(ETH)","CurrentValue","Historical $Price/Eth","Status","ErrCode","Type"',
  '"Transaction Hash","Blockno","UnixTimestamp","DateTime (UTC)","ParentTxFrom","ParentTxTo","ParentTxETH_Value","From","TxTo","ContractAddress","Value_IN(ETH)","Value_OUT(ETH)","CurrentValue","Historical $Price/Eth","Status","ErrCode","Type"',
]

export function parser(
  csvRow: string,
  index: number,
  fileImportId: string,
  _parserContext,
  _header: string
): ParserResult {
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

  const assetId = PLATFORMS_META.ethereum.nativeAssetId as string
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
        change: `-${valueIn}`,
        fileImportId,
        id: `${txId}_WETH_${index}`,
        importIndex: index + 0.1,
        operation: "Withdraw",
        platform,
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

  return { logs, txns: [tx] }
}
