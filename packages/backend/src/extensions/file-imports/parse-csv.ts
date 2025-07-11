import { HEADER_MATCHER, PARSER_MATCHER } from "src/extensions/file-imports/matchers"
import {
  AuditLog,
  AuditLogOperation,
  FileImport,
  ProgressCallback,
  Transaction,
} from "src/interfaces"
import { splitRows } from "src/utils/csv-utils"
import { extractTransactions } from "src/utils/extract-utils"

export function sanitizeHeader(headerRow: string) {
  return headerRow
    .replace("ï»¿", "") // mexc
    .replace(/CurrentValue @ \$\d+(\.\d+)?\/Eth,?/, "CurrentValue") // etherscan
    .trim()
}

export async function parseCsv(
  text: string,
  _fileImportId: string,
  progress: ProgressCallback,
  parserContext: Record<string, unknown>
) {
  await progress([undefined, `Extracting rows...`])
  const rows = splitRows(text.trim())

  const header = sanitizeHeader(rows[0])
  const parserId = HEADER_MATCHER[header]
  const parser = PARSER_MATCHER[parserId]

  if (!parser) {
    throw new Error(`File import unsupported, unknown header: ${header}`)
  }

  const { extensionId, platformId, parse } = parser

  const logs: AuditLog[] = []
  let transactions: Transaction[] = []
  const assetMap: Record<string, boolean> = {}
  const walletMap: Record<string, boolean> = {}
  const operationMap: Partial<Record<AuditLogOperation, boolean>> = {}
  // const pairList = new Set()

  await progress([undefined, `Parsing ${rows.length - 1} rows`])
  // Skip header
  for (let index = 0; index < rows.length - 1; index++) {
    const row = rows[index + 1]
    try {
      if (index !== 0 && (index + 1) % 1000 === 0) {
        await progress([undefined, `Parsing row ${index + 1}`])
      }
      const { logs: newLogs, txns } = parse(row, index, _fileImportId, parserContext, header)

      // const x = txns?.[0]?.incomingAsset?.replace("binance:", "")
      // const y = txns?.[0]?.outgoingAsset?.replace("binance:", "")
      // pairList.add(`${x}${y}`)

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
  }

  await progress([50, `Extracting transactions`])
  transactions = transactions.concat(extractTransactions(logs, _fileImportId, parserId))
  // transactions = groupTransactions(transactions, _fileImportId, parserId)

  const metadata: FileImport["meta"] = {
    assetIds: Object.keys(assetMap),
    extensionId,
    logs: logs.length,
    operations: Object.keys(operationMap) as AuditLogOperation[],
    parserId,
    // pairList: Array.from(pairList),
    platformId,
    rows: rows.length - 1,
    transactions: transactions.length,
    wallets: Object.keys(walletMap),
  }

  return { logs, metadata, transactions }
}
