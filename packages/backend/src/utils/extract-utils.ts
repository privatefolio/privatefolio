import { parserId as binanceAccountStatement } from "src/extensions/file-imports/binance"
import * as binance from "src/extensions/utils/binance-utils"
import { AuditLog, Transaction } from "src/interfaces"

/**
 * @warn This function mutates the logs param
 */
export function extractTransactions(
  logs: AuditLog[],
  fileImportId: string,
  parserId: string
): Transaction[] {
  const transactions: Transaction[] = []

  if (parserId === binanceAccountStatement) {
    return binance.extractTransactions(logs, fileImportId)
  }

  return transactions
}

export function groupTransactions(
  transactions: Transaction[],
  _fileImportId: string,
  _parserId: string
): Transaction[] {
  // if (parserId === "binance-spot-history") {
  //   return binance.groupTransactions(transactions)
  // }

  return transactions
}
