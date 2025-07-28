import Big from "big.js"
import { AuditLog, AuditLogOperation, ParserResult, Transaction } from "src/interfaces"
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
  const exchange = columns[3]
  const pair = columns[4]
  const type = columns[5]
  const amount = new Big(columns[6])
  const price = columns[7] ? new Big(columns[7]) : new Big(0)
  const priceUsd = columns[8] ? new Big(columns[8]) : new Big(0)
  const feePercent = columns[9]
  const feeAmount = columns[10] ? new Big(columns[10]) : new Big(0)
  const feeCurrency = columns[11]
  const date = columns[12]
  const notes = columns[13]

  // Handle duplicate transactions
  if (notes.toLowerCase().includes("duplicate")) {
    return { logs: [] }
  }

  // Skip fake transactions created to fill balance
  if (notes.includes("fake transaction created to fill your balance")) {
    return { logs: [] }
  }

  // Map CoinStats types to our operation types
  let operation: AuditLogOperation
  switch (type.toLowerCase()) {
    case "buy":
      operation = "Buy"
      break
    case "sell":
      operation = "Sell"
      break
    case "fill":
      // For fills, determine buy/sell based on amount sign
      operation = amount.gt(0) ? "Buy" : "Sell"
      break
    default:
      // For other types, try to map based on common patterns
      if (type.toLowerCase().includes("deposit")) {
        operation = "Deposit"
      } else if (type.toLowerCase().includes("withdraw")) {
        operation = "Withdraw"
      } else {
        operation = "Buy" // Default fallback
      }
  }

  // Adjust operation based on amount sign if needed
  if (operation === "Buy" && amount.lt(0)) {
    operation = "Sell"
  } else if (operation === "Sell" && amount.gt(0)) {
    operation = "Buy"
  }

  const assetId = `${platformId}:${coinSymbol}`
  const id = `${fileImportId}_${hashString(`${assetId}_${operation}_${amount.toString()}`)}_${index}`
  const txId = `${id}_TX`
  const timestamp = asUTC(new Date(date))
  const wallet = portfolio

  const log: AuditLog = {
    assetId,
    change: amount.toFixed(),
    fileImportId,
    id,
    importIndex: index,
    operation,
    platformId,
    timestamp,
    wallet,
  }

  let txns: Transaction[] = []

  if (operation === "Buy") {
    txns = [
      {
        fileImportId,
        id: txId,
        importIndex: index,
        incoming: amount.toFixed(),
        incomingAsset: assetId,
        metadata: {
          coinName,
          exchange,
          feeAmount: feeAmount.toString(),
          feeCurrency,
          pair,
          price: price.toString(),
          priceUsd: priceUsd.toString(),
        },
        platformId,
        timestamp,
        type: "Buy",
        wallet,
      },
    ]
    log.txId = txId
  }

  if (operation === "Sell") {
    txns = [
      {
        fileImportId,
        id: txId,
        importIndex: index,
        metadata: {
          coinName,
          exchange,
          feeAmount: feeAmount.toString(),
          feeCurrency,
          pair,
          price: price.toString(),
          priceUsd: priceUsd.toString(),
        },
        outgoing: amount.abs().toFixed(),
        outgoingAsset: assetId,
        platformId,
        timestamp,
        type: "Sell",
        wallet,
      },
    ]
    log.txId = txId
  }

  if (operation === "Deposit") {
    txns = [
      {
        fileImportId,
        id: txId,
        importIndex: index,
        incoming: amount.toFixed(),
        incomingAsset: assetId,
        metadata: {
          coinName,
          exchange,
          pair,
          price: price.toString(),
          priceUsd: priceUsd.toString(),
        },
        platformId,
        timestamp,
        type: "Deposit",
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
        metadata: {
          coinName,
          exchange,
          pair,
          price: price.toString(),
          priceUsd: priceUsd.toString(),
        },
        outgoing: amount.abs().toFixed(),
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
