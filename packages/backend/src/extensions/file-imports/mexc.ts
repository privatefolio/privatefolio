import {
  AuditLog,
  ParserResult,
  Transaction,
  TransactionRole,
  TransactionSide,
} from "src/interfaces"
import { extractColumnsFromRow } from "src/utils/csv-utils"
import { asUTC } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

export const extensionId = "mexc-file-import"
export const parserId = "mexc"
export const platform = "mxc"

export const HEADER = "Pairs,Time,Side,Filled Price,Executed Amount,Total,Fee,Role"

export function parse(csvRow: string, index: number, fileImportId: string): ParserResult {
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
  const feeAssetId = quoteAssetId // ?
  //
  const wallet = "MEXC Spot"

  const txns: Transaction[] = []
  const logs: AuditLog[] = []

  if (side === "BUY") {
    txns.push({
      fee,
      feeAsset: feeAssetId,
      fileImportId,
      id: txId,
      importIndex: index,
      incoming: amount,
      incomingAsset: assetId,
      metadata: {},
      outgoing: total,
      outgoingAsset: quoteAssetId,
      platform,
      price,
      role,
      timestamp,
      type: "Buy",
      wallet,
    })
    logs.push({
      assetId: quoteAssetId,
      change: `-${total}`,
      fileImportId,
      id: `${txId}_0`,
      importIndex: index,
      operation: "Sell",
      platform,
      timestamp,
      wallet,
    })
    logs.push({
      assetId,
      change: amount,
      fileImportId,
      id: `${txId}_1`,
      importIndex: index + 0.1,
      operation: "Buy",
      platform,
      timestamp,
      wallet,
    })
  } else {
    // SIDE === "SELL"
    txns.push({
      fee,
      feeAsset: feeAssetId,
      fileImportId,
      id: txId,
      importIndex: index,
      incoming: total,
      incomingAsset: quoteAssetId,
      metadata: {},
      outgoing: amount,
      outgoingAsset: assetId,
      platform,
      price,
      role,
      timestamp,
      type: "Sell",
      wallet,
    })
    logs.push({
      assetId,
      change: `-${amount}`,
      fileImportId,
      id: `${txId}_0`,
      importIndex: index,
      operation: "Sell",
      platform,
      timestamp,
      wallet,
    })
    logs.push({
      assetId: quoteAssetId,
      change: total,
      fileImportId,
      id: `${txId}_1`,
      importIndex: index + 0.1,
      operation: "Buy",
      platform,
      timestamp,
      wallet,
    })
  }

  logs.push({
    assetId: quoteAssetId,
    change: `-${fee}`,
    fileImportId,
    id: `${txId}_2`,
    importIndex: index + 0.2,
    operation: "Fee",
    platform,
    timestamp,
    wallet,
  })

  return { logs, txns }
}
