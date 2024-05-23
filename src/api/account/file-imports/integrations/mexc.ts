import {
  AuditLog,
  ParserResult,
  Transaction,
  TransactionRole,
  TransactionSide,
} from "src/interfaces"
import { PlatformId } from "src/settings"
import { asUTC } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

import { extractColumnsFromRow } from "../csv-utils"

export const Identifier = "mexc"
export const platform: PlatformId = "mexc"

export const HEADER = "Pairs,Time,Side,Filled Price,Executed Amount,Total,Fee,Role"

export function parser(csvRow: string, index: number, fileImportId: string): ParserResult {
  const columns = extractColumnsFromRow(csvRow, 8)
  //
  const marketPair = columns[0]
  const assetId = `mexc:${marketPair.split("_")[0]}`
  const quoteAssetId = `mexc:${marketPair.split("_")[1]}`
  const timestamp = asUTC(new Date(columns[1]))
  //
  const side = columns[2] as TransactionSide
  const price = columns[3]
  const amount = columns[4]
  const total = columns[5]
  const fee = columns[6]
  const role = columns[7] as TransactionRole
  //
  const hash = hashString(`${index}_${csvRow}`)
  const txId = `${fileImportId}_${hash}`
  const amountN = parseFloat(amount)
  const priceN = parseFloat(price)
  const feeN = parseFloat(fee)
  const totalN = parseFloat(total)
  const feeAssetId = quoteAssetId // ?
  //
  const wallet = "MEXC Spot"

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
      incoming: amount,
      incomingAsset: assetId,
      incomingN: amountN,
      outgoing: total,
      outgoingAsset: quoteAssetId,
      outgoingN: totalN,
      platform,
      price,
      priceN,
      role,
      timestamp,
      type: "Buy",
      wallet,
    })
    logs.push({
      _id: `${txId}_0`,
      assetId: quoteAssetId,
      change: `-${total}`,
      changeN: parseFloat(`-${total}`),
      importId: fileImportId,
      importIndex: index,
      operation: "Sell",
      platform,
      timestamp,
      wallet,
    })
    logs.push({
      _id: `${txId}_1`,
      assetId,
      change: amount,
      changeN: parseFloat(amount),
      importId: fileImportId,
      importIndex: index + 0.1,
      operation: "Buy",
      platform,
      timestamp,
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
      incoming: total,
      incomingAsset: quoteAssetId,
      incomingN: totalN,
      outgoing: amount,
      outgoingAsset: assetId,
      outgoingN: amountN,
      platform,
      price,
      priceN,
      role,
      timestamp,
      type: "Sell",
      wallet,
    })
    logs.push({
      _id: `${txId}_0`,
      assetId,
      change: `-${amount}`,
      changeN: parseFloat(`-${amount}`),
      importId: fileImportId,
      importIndex: index,
      operation: "Sell",
      platform,
      timestamp,
      wallet,
    })
    logs.push({
      _id: `${txId}_1`,
      assetId: quoteAssetId,
      change: total,
      changeN: parseFloat(total),
      importId: fileImportId,
      importIndex: index + 0.1,
      operation: "Buy",
      platform,
      timestamp,
      wallet,
    })
  }

  logs.push({
    _id: `${txId}_2`,
    assetId: quoteAssetId,
    change: `-${fee}`,
    changeN: parseFloat(`-${fee}`),
    importId: fileImportId,
    importIndex: index + 0.2,
    operation: "Fee",
    platform,
    timestamp,
    wallet,
  })

  return { logs, txns }
}
