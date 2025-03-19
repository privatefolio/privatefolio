import { AuditLog, ParserResult, Transaction, TransactionSide } from "src/interfaces"
import { PlatformId } from "src/settings"
import { asUTC } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

import { BinancePair } from "../../connections/integrations/binance/binance-account-api"
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
  const pairSymbol = columns[1]
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
  const feeAssetId = `binance:${feeSymbol}`
  const baseAssetId = `binance:${executedSymbol}`
  const quoteAssetId = `binance:${amountSymbol}`
  //
  const txns: Transaction[] = []
  const logs: AuditLog[] = []

  const pair: BinancePair = {
    baseAsset: executedSymbol,
    quoteAsset: amountSymbol,
    symbol: pairSymbol,
  }

  if (side === "BUY") {
    txns.push({
      fee,
      feeAsset: feeAssetId,
      fileImportId,
      id: txId,
      importIndex: index,
      incoming: executed,
      incomingAsset: baseAssetId,
      metadata: { pair },
      outgoing: amount,
      outgoingAsset: quoteAssetId,
      platform,
      price,
      timestamp,
      type: "Swap",
      wallet,
    })
    logs.push({
      assetId: quoteAssetId,
      change: `-${amount}`,
      fileImportId,
      id: `${txId}_0`,
      importIndex: index,
      operation: "Sell",
      platform,
      timestamp,
      txId,
      wallet,
    })
    logs.push({
      assetId: baseAssetId,
      change: executed,
      fileImportId,
      id: `${txId}_1`,
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
      fee,
      feeAsset: feeAssetId,
      fileImportId,
      id: txId,
      importIndex: index,
      incoming: amount,
      incomingAsset: quoteAssetId,
      metadata: { pair },
      outgoing: executed,
      outgoingAsset: baseAssetId,
      platform,
      price,
      timestamp,
      type: "Swap",
      wallet,
    })
    logs.push({
      assetId: baseAssetId,
      change: `-${executed}`,
      fileImportId,
      id: `${txId}_0`,
      importIndex: index,
      operation: "Sell",
      platform,
      timestamp,
      txId,
      wallet,
    })
    logs.push({
      assetId: quoteAssetId,
      change: amount,
      fileImportId,
      id: `${txId}_1`,
      importIndex: index + 0.1,
      operation: "Buy",
      platform,
      timestamp,
      txId,
      wallet,
    })
  }

  logs.push({
    assetId: feeAssetId,
    change: `-${fee}`,
    fileImportId,
    id: `${txId}_2`,
    importIndex: index + 0.2,
    operation: "Fee",
    platform,
    timestamp,
    txId,
    wallet,
  })

  return { logs, txns }
}
