import {
  AuditLog,
  AuditLogOperation,
  FileImport,
  ParserContextFn,
  Transaction,
} from "src/interfaces"
import { ProgressCallback } from "src/stores/task-store"
import { extractTransactions, groupTransactions } from "src/utils/extract-utils"

import { HEADER_MATCHER, PARSER_MATCHER, PLATFORM_MATCHER } from "./integrations"

export async function parseCsv(
  text: string,
  _fileImportId: string,
  progress: ProgressCallback,
  getParserContext: ParserContextFn
) {
  // Parse CSV
  const rows = text.trim().split(/\r?\n(?=(?:[^"]*"[^"]*")*[^"]*$)/)

  const header = rows[0]
    .replace("ï»¿", "") // mexc
    .replace(/CurrentValue @ \$\d+(\.\d+)?\/Eth,?/, "CurrentValue") // etherscan
    .trim()

  const parserId = HEADER_MATCHER[header]
  const parser = PARSER_MATCHER[parserId]
  const platform = PLATFORM_MATCHER[parserId]

  if (!parser) {
    throw new Error(`File import unsupported, unknown header: ${header}`)
  }

  const requirements = parserId === "etherscan-erc20" ? ["userAddress"] : []
  const parserContext = requirements.length === 0 ? {} : await getParserContext(requirements)

  const logs: AuditLog[] = []
  let transactions: Transaction[] = []
  const assetMap: Record<string, boolean> = {}
  const walletMap: Record<string, boolean> = {}
  const operationMap: Partial<Record<AuditLogOperation, boolean>> = {}

  progress([0, `Parsing ${rows.length - 1} rows`])
  // Skip header
  rows.slice(1).forEach((row, index) => {
    try {
      if (index !== 0 && (index + 1) % 1000 === 0) {
        progress([(index * 50) / rows.length, `Parsing row ${index + 1}`])
      }
      const { logs: newLogs, txns } = parser(row, index, _fileImportId, parserContext)

      for (const log of newLogs) {
        logs.push(log)
        assetMap[log.assetId] = true
        walletMap[log.wallet] = true
        operationMap[log.operation] = true
      }

      if (txns) {
        transactions = transactions.concat(txns)
      }
    } catch (error) {
      throw new Error(`Cannot parse row ${index + 1}: ${String(error)}`)
    }
  })

  progress([50, `Extracting transactions`])
  if (transactions.length === 0) {
    // warn: this fn mutates logs
    transactions = extractTransactions(logs, _fileImportId, parserId)
  } else {
    transactions = groupTransactions(transactions, _fileImportId, parserId)
  }

  const metadata: FileImport["meta"] = {
    assetIds: Object.keys(assetMap),
    integration: parserId,
    logs: logs.length,
    operations: Object.keys(operationMap) as AuditLogOperation[],
    platform,
    rows: rows.length - 1,
    transactions: transactions.length,
    wallets: Object.keys(walletMap),
  }

  return { logs, metadata, transactions }
}
