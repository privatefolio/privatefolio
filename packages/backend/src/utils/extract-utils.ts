import { parserId as binanceAccountStatement } from "src/extensions/file-imports/binance"
import * as binance from "src/extensions/utils/binance-utils"
import { AuditLog, Transaction } from "src/interfaces"
import { BINANCE_PLATFORM_ID } from "src/settings/platforms"

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

export function mergeAuditLogs(logs: AuditLog[], importId: string, platformId: string): AuditLog[] {
  if (platformId === BINANCE_PLATFORM_ID) {
    return binance.mergeAuditLogs(logs, importId, platformId)
  }

  return logs
}
