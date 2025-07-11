import Big from "big.js"
import { AuditLog, AuditLogOperation, ParserResult, Transaction } from "src/interfaces"
import { extractColumnsFromRow } from "src/utils/csv-utils"
import { asUTC } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

import { BINANCE_PLATFORM_ID } from "../utils/binance-utils"

export const extensionId = "binance-file-import"
export const parserId = "binance-account-statement"
export const platformId = BINANCE_PLATFORM_ID

export const HEADERS = [
  '"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"',
  "User_ID,UTC_Time,Account,Operation,Coin,Change,Remark",
]

export function parse(csvRow: string, index: number, fileImportId: string): ParserResult {
  const columns = extractColumnsFromRow(csvRow, 7)
  //
  // const userId = columns[0]
  const utcTime = columns[1]
  const account = columns[2]
  let operation = columns[3]
    .replace("Transaction ", "")
    .replace("Sold", "Sell")
    .replace("Fiat ", "")
    .replace("Asset Conversion Transfer", "Conversion")
    .replace("Crypto Box", "Reward")
    .replace("Distribution", "Reward")
    // .replace("Launchpool Earnings Withdrawal", "")
    // .replace("Launchpool Subscription/Redemption", "")
    .replace("Insurance Fund Compensation", "Insurance Fund")
    // .replace("Commission History", "Fee")
    .replace("Binance Convert", "Conversion")
    .replace("Withdrawal", "Withdraw")
    .replace("Spend", "Sell") as AuditLogOperation
  if (operation.includes("Small Assets Exchange")) {
    operation = "Conversion"
  } else if (operation.includes("Transfer Between")) {
    operation = "Transfer"
  }
  const coin = columns[4]
  const change = new Big(columns[5])
  const remark = columns[6]
  //
  if (remark === "Duplicate") {
    return { logs: [] }
  }
  //
  const hash = hashString(`${index}_${csvRow}`)
  const id = `${fileImportId}_${hash}`
  const timestamp = asUTC(new Date(utcTime))
  const assetId = `${platformId}:${coin}`
  const wallet = `Binance ${account}`
  const txId = `${id}_TX`

  const log: AuditLog = {
    // account,
    assetId,
    change: change.toFixed(),
    // coin,
    fileImportId,
    id,
    importIndex: index,
    operation,
    platformId,
    // remark,
    timestamp,
    txId,
    // userId,
    // utcTime,
    wallet,
  }

  let txns: Transaction[] = []
  if (operation === "Deposit" || operation === "Reward") {
    txns = [
      {
        fileImportId,
        id: txId,
        importIndex: index,
        incoming: change.toFixed(),
        incomingAsset: assetId,
        metadata: {},
        platformId,
        timestamp,
        type: operation,
        wallet,
      },
    ]
  }

  if (operation === "Withdraw") {
    txns = [
      {
        fileImportId,
        id: txId,
        importIndex: index,
        metadata: {},
        outgoing: change.mul(-1).toFixed(),
        outgoingAsset: assetId,
        platformId,
        timestamp,
        type: "Withdraw",
        wallet,
      },
    ]
  }

  return { logs: [log], txns }
}
