import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { PlatformPrefix } from "src/settings/settings"
import { asUTC } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

export const extensionId = "coinstats-file-import"
export const parserId = "coinstats-transactions"
export const platformId = `${PlatformPrefix.App}coinstats`

export const HEADERS = [
  '"Portfolio","Coin Name","Coin Symbol","Exchange","Pair","Type","Amount","Price","Price USD","Fee Percent","Fee Amount","Fee Currency","Date","Notes"',
  "Portfolio,Coin Name,Coin Symbol,Exchange,Pair,Type,Amount,Price,Price USD,Fee Percent,Fee Amount,Fee Currency,Date,Notes",
]

export function parse(csvRow: string, index: number, fileImportId: string): ParserResult {
  const columns = csvRow.split(",")

  const portfolio = columns[0]
  const coinName = columns[1]
  const coinSymbol = columns[2]
  // const exchange = columns[3]
  // const pair = columns[4]
  const type = columns[5].replace("Sent", "Withdraw").replace("Received", "Deposit")
  const amount = new Big(columns[6])
  // const price = columns[7] ? new Big(columns[7]) : new Big(0)
  // const priceUsd = columns[8] ? new Big(columns[8]) : new Big(0)
  // const feePercent = columns[9]
  // const feeAmount = columns[10] ? new Big(columns[10]) : new Big(0)
  // const feeCurrency = columns[11]
  const date = columns[12]
  const notes = columns[13]

  if (notes.toLowerCase().includes("duplicate")) {
    return { logs: [] }
  }

  if (notes.includes("fake transaction created to fill your balance")) {
    return { logs: [] }
  }

  if (coinName.includes("ERC721") || type === "Fill") {
    return { logs: [] }
  }

  const operation = type as AuditLogOperation
  let change = amount.toFixed()

  if (operation === "Withdraw" && !change.includes("-")) {
    change = `-${change}`
  }

  const assetId = `${platformId}:${coinSymbol}`
  const id = `${fileImportId}_${hashString(`${assetId}_${operation}_${amount.toString()}`)}_${index}`
  const txId = `${id}_TX`
  const timestamp = asUTC(new Date(date))
  const wallet = portfolio

  const log: AuditLog = {
    assetId,
    change,
    fileImportId,
    id,
    importIndex: index,
    operation,
    platformId,
    timestamp,
    wallet,
  }

  const incoming = operation === "Buy" || operation === "Deposit" ? change : undefined
  const incomingAsset = operation === "Buy" || operation === "Deposit" ? assetId : undefined
  const outgoing = operation === "Sell" || operation === "Withdraw" ? change : undefined
  const outgoingAsset = operation === "Sell" || operation === "Withdraw" ? assetId : undefined

  const txns: Transaction[] = [
    {
      fileImportId,
      id: txId,
      importIndex: index,
      incoming,
      incomingAsset,
      metadata: {},
      outgoing,
      outgoingAsset,
      platformId,
      timestamp,
      type: operation as TransactionType,
      wallet,
    },
  ]

  log.txId = txId

  return { logs: [log], txns }
}
