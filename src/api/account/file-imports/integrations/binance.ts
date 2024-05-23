import Big from "big.js"
import { AuditLog, AuditLogOperation, ParserResult, Transaction } from "src/interfaces"
import { PlatformId } from "src/settings"
import { asUTC } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

import { extractColumnsFromRow } from "../csv-utils"

export const Identifier = "binance-account-statement"
export const platform: PlatformId = "binance"

export const HEADERS = [
  '"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"',
  "User_ID,UTC_Time,Account,Operation,Coin,Change,Remark",
]

export function parser(csvRow: string, index: number, fileImportId: string): ParserResult {
  const columns = extractColumnsFromRow(csvRow, 7)
  //
  const userId = columns[0]
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
  const _id = `${fileImportId}_${hash}`
  const timestamp = asUTC(new Date(utcTime))
  const changeN = change.toNumber()
  const assetId = `binance:${coin}`
  const wallet = `Binance ${account}`

  const log: AuditLog = {
    _id,
    // account,
    assetId,
    change: change.toFixed(),
    changeN,
    // coin,
    importId: fileImportId,
    importIndex: index,
    operation,
    platform,
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
        _id,
        importId: fileImportId,
        importIndex: index,
        incoming: change.toFixed(),
        incomingAsset: assetId,
        incomingN: changeN,
        platform,
        timestamp,
        type: operation,
        wallet,
      },
    ]
  }

  if (operation === "Withdraw") {
    txns = [
      {
        _id,
        importId: fileImportId,
        importIndex: index,
        outgoing: change.mul(-1).toFixed(),
        outgoingAsset: assetId,
        outgoingN: -changeN,
        platform,
        timestamp,
        type: "Withdraw",
        wallet,
      },
    ]
  }
  console.log("🚀 ~ parser ~ txns:", txns.length)

  return { logs: [log], txns }
}
