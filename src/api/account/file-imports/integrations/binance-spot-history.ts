import { AuditLog, ParserResult, Transaction, TransactionSide } from "src/interfaces"
import { PlatformId } from "src/settings"
import { asUTC } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

import { extractColumnsFromRow } from "../csv-utils"

export const Identifier = "binance-spot-history"
export const platform: PlatformId = "binance"

export const HEADER = '"Date(UTC)","Pair","Side","Price","Executed","Amount","Fee"'

/**
 * @deprecated do not use!
 */
export function parser(csvRow: string, index: number, fileImportId: string): ParserResult {
  const columns = extractColumnsFromRow(csvRow, 7)
  //
  const utcTime = columns[0]
  // const pair = columns[1]
  const side = columns[2] as TransactionSide
  const price = columns[3]
  const executedWithSymbol = columns[4]
  const amountWithSymbol = columns[5]
  const feeWithSymbol = columns[6]
  //
  const hash = hashString(`${index}_${csvRow}`)
  const txId = `${fileImportId}_${hash}`
  const timestamp = asUTC(new Date(utcTime))
  const wallet = `Binance Spot`
  //
  const [, executed, executedSymbol] = executedWithSymbol.match(/([0-9.]+)([A-Za-z]+)/) || []
  const [, amount, amountSymbol] = amountWithSymbol.match(/([0-9.]+)([A-Za-z]+)/) || []
  const [, fee, feeSymbol] = feeWithSymbol.match(/([0-9.]+)([A-Za-z]+)/) || []
  const feeN = parseFloat(fee)
  const amountN = parseFloat(amount)
  const executedN = parseFloat(executed)
  const priceN = parseFloat(price)
  const feeAssetId = `binance:${feeSymbol}`
  const assetId = `binance:${executedSymbol}`
  const quoteAssetId = `binance:${amountSymbol}`
  //
  const txns: Transaction[] = []
  const logs: AuditLog[] = []

  if (side === "BUY") {
    txns.push({
      _id: txId,
      fee,
      feeAsset: feeAssetId,
      feeN,
      importId: fileImportId,
      importIndex: index,
      incoming: executed,
      incomingAsset: assetId,
      incomingN: executedN,
      outgoing: amount,
      outgoingAsset: quoteAssetId,
      outgoingN: amountN,
      platform,
      price,
      priceN,
      timestamp,
      type: "Swap",
      wallet,
    })
    logs.push({
      _id: `${txId}_0`,
      assetId: quoteAssetId,
      change: `-${amount}`,
      changeN: parseFloat(`-${amount}`),
      importId: fileImportId,
      importIndex: index,
      operation: "Sell",
      platform,
      timestamp,
      txId,
      wallet,
    })
    logs.push({
      _id: `${txId}_1`,
      assetId,
      change: executed,
      changeN: parseFloat(executed),
      importId: fileImportId,
      importIndex: index + 0.1,
      operation: "Buy",
      platform,
      timestamp,
      txId,
      wallet,
    })
  } else {
    // SIDE === "SELL"
    txns.push({
      _id: txId,
      fee,
      feeAsset: feeAssetId,
      feeN,
      importId: fileImportId,
      importIndex: index,
      incoming: amount,
      incomingAsset: quoteAssetId,
      incomingN: amountN,
      outgoing: executed,
      outgoingAsset: assetId,
      outgoingN: executedN,
      platform,
      price,
      priceN,
      timestamp,
      type: "Swap",
      wallet,
    })
    logs.push({
      _id: `${txId}_0`,
      assetId,
      change: `-${executed}`,
      changeN: parseFloat(`-${executed}`),
      importId: fileImportId,
      importIndex: index,
      operation: "Sell",
      platform,
      timestamp,
      txId,
      wallet,
    })
    logs.push({
      _id: `${txId}_1`,
      assetId: quoteAssetId,
      change: amount,
      changeN: parseFloat(amount),
      importId: fileImportId,
      importIndex: index + 0.1,
      operation: "Buy",
      platform,
      timestamp,
      txId,
      wallet,
    })
  }

  logs.push({
    _id: `${txId}_2`,
    assetId: feeAssetId,
    change: `-${fee}`,
    changeN: parseFloat(`-${fee}`),
    importId: fileImportId,
    importIndex: index + 0.2,
    operation: "Fee",
    platform,
    timestamp,
    txId,
    wallet,
  })

  return { logs, txns }
}
