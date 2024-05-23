import {
  AuditLog,
  AuditLogOperation,
  EtherscanTransaction,
  ParserResult,
  TransactionType,
} from "src/interfaces"
import { PlatformId, PLATFORMS_META } from "src/settings"
import { asUTC } from "src/utils/formatting-utils"

import { extractColumnsFromRow } from "../csv-utils"

export const Identifier = "etherscan-internal"
export const platform: PlatformId = "ethereum"

export const HEADER2 =
  '"Txhash","Blockno","UnixTimestamp","DateTime (UTC)","From","To","ContractAddress","Value_IN(ETH)","Value_OUT(ETH)","CurrentValue","TxnFee(ETH)","TxnFee(USD)","Historical $Price/Eth","Status","ErrCode","Method"'
export const HEADER =
  '"Txhash","Blockno","UnixTimestamp","DateTime (UTC)","ParentTxFrom","ParentTxTo","ParentTxETH_Value","From","TxTo","ContractAddress","Value_IN(ETH)","Value_OUT(ETH)","CurrentValue","Historical $Price/Eth","Status","ErrCode","Type"'

export function parser(csvRow: string, index: number, fileImportId: string): ParserResult {
  const columns = extractColumnsFromRow(csvRow, 16) // FIXME one header has 16 columns, the other has 17
  //
  const txHash = columns[0]
  // const blockNumber = columns[1]
  // const unixTimestamp = columns[2]
  const datetimeUtc = columns[3]
  const parentTxFrom = columns[4]
  // const parentTxTo = columns[5]
  // const parentTxEthValue = columns[6]
  const from = columns[7]
  const txTo = columns[8]
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
  } else {
    type = operation
    const change = operation === "Deposit" ? valueIn : `-${valueOut}`
    const changeN = parseFloat(change)

    logs.push({
      _id: `${txId}_VALUE_${index}`,
      assetId,
      change,
      changeN,
      importId: fileImportId,
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
        change: `-${valueIn}`,
        changeN: parseFloat(`-${valueIn}`),
        importId: fileImportId,
        importIndex: index + 0.1,
        operation: "Withdraw",
        platform,
        timestamp,
        txId,
        wallet,
      })
    }
  }

  const tx: EtherscanTransaction = {
    _id: txId,
    importId: fileImportId,
    importIndex: index,
    incoming: valueIn,
    incomingAsset: assetId,
    incomingN: parseFloat(valueIn),
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

  return { logs, txns: [tx] }
}
