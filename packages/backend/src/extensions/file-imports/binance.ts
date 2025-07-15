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
    .replace("Isolated ", "")
    .replace("Binance Convert", "Conversion")
    .replace("Withdrawal", "Withdraw")
    .replace("Revenue", "Buy")
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
  if (remark.toLocaleLowerCase().includes("duplicate")) {
    return { logs: [] }
  }
  // if (!["Buy", "Fee", "Sell"].includes(operation)) {
  //   return { logs: [] }
  // }
  // if (account.toLowerCase().includes("isolated")) {
  //   return { logs: [] }
  // }
  //
  // Sometimes Transaction Buy/Sell is wrong and has to be corrected by on sign
  if (operation === "Buy" && change.lt(0)) {
    operation = "Sell"
  } else if (operation === "Sell" && change.gt(0)) {
    operation = "Buy"
  }

  const assetId = `${platformId}:${coin}`
  const id = `${fileImportId}_${hashString(`${assetId}_${operation}_${change.toString()}`)}_${index}`
  const txId = `${id}_TX`
  const timestamp = asUTC(new Date(utcTime))
  const wallet = `Binance ${account}`

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
    log.txId = txId
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
    log.txId = txId
  }

  return { logs: [log], txns }
}
