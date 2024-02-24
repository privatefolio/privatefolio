import { AuditLogOperation, BinanceAuditLog, ParserResult } from "src/interfaces"
import { Platform } from "src/settings"
import { asUTC } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

export const Identifier = "binance-account-statement"
export const platform: Platform = "binance"

export const HEADERS = [
  '"User_ID","UTC_Time","Account","Operation","Coin","Change","Remark"',
  "User_ID,UTC_Time,Account,Operation,Coin,Change,Remark",
]

export function parser(csvRow: string, index: number, fileImportId: string): ParserResult {
  const row = csvRow.replaceAll('"', "")
  const columns = row.split(",")
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
  const change = columns[5]
  const remark = columns[6]
  //
  if (remark === "Duplicate") {
    return { logs: [] }
  }
  //
  const hash = hashString(`${index}_${csvRow}`)
  const _id = `${fileImportId}_${hash}`
  const timestamp = asUTC(new Date(utcTime))
  const changeN = parseFloat(change)
  const assetId = `binance:${coin}`
  const wallet = `Binance ${account}`

  const log: BinanceAuditLog = {
    _id,
    account,
    assetId,
    change,
    changeN,
    coin,
    importId: fileImportId,
    importIndex: index,
    operation,
    platform,
    remark,
    timestamp,
    userId,
    utcTime,
    wallet,
  }

  return { logs: [log] }
}
