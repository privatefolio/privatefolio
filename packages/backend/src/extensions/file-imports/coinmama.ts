import Big from "big.js"
import { AuditLog, AuditLogOperation, ParserResult, Transaction } from "src/interfaces"
import { asUTC } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

export const extensionId = "coinmama-file-import"
export const parserId = "coinmama"
export const platform = "coinmama"

export const HEADER = "Transaction, Type,	Amount,	Date Created,	Status"

export function parse(csvRow: string, index: number, fileImportId: string): ParserResult {
  const columns = csvRow.split(",")
  //
  const transaction = columns[0].replaceAll(
    "Buy (Credit or Debit Card)",
    "Buy with Credit Card"
  ) as AuditLogOperation
  const type = columns[1].trim()
  const amount = columns[2].trim()
  const dateCreated = `${columns[3]} ${columns[4]}`
  const status = columns[5].trim()
  //
  if (status !== "Completed") {
    return { logs: [] }
  }
  //
  const hash = hashString(`${index}_${csvRow}`)
  const txId = `${fileImportId}_${hash}`
  const timestamp = asUTC(new Date(dateCreated))
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${dateCreated}`)
  }
  const incoming = type.split(" ")[0]
  const assetId = `coinmama:${type.split(" ")[1]}`
  const incomingAsset = assetId
  const outgoing = amount.split(" ")[0]
  const outgoingAsset = `coinmama:${amount.split(" ")[1]}`
  const wallet = "Coinmama Spot"
  const price = Big(incoming).div(outgoing).toString()

  const tx: Transaction = {
    fileImportId,
    id: txId,
    importIndex: index,
    // fee,
    // feeAsset,
    incoming,
    incomingAsset,
    metadata: {},
    outgoing,
    outgoingAsset,
    platform,
    price,
    timestamp,
    type: "Buy",
    wallet,
  }

  const logs: AuditLog[] = [
    {
      assetId,
      change: incoming,
      fileImportId,
      id: `${txId}_0`,
      importIndex: index,
      operation: transaction as AuditLogOperation,
      platform,
      timestamp,
      wallet,
    },
  ]

  return { logs, txns: [tx] }
}
