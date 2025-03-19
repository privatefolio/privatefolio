import { ParserId } from "src/settings"

import { AuditLog, Transaction } from "../interfaces"
import * as binance from "./integrations/binance-utils"

/**
 * @warn This function mutates the logs param
 */
export function extractTransactions(
  logs: AuditLog[],
  fileImportId: string,
  parserId: ParserId
): Transaction[] {
  const transactions: Transaction[] = []

  if (parserId === "binance-account-statement") {
    return binance.extractTransactions(logs, fileImportId)
  }

  return transactions
}

export function groupTransactions(
  transactions: Transaction[],
  _fileImportId: string,
  parserId: ParserId
): Transaction[] {
  if (parserId === "binance-spot-history") {
    return binance.groupTransactions(transactions)
  }

  return transactions
}
