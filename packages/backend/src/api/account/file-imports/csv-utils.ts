import {
  AuditLog,
  AuditLogOperation,
  FileImport,
  ProgressCallback,
  Transaction,
} from "src/interfaces"
import { extractTransactions } from "src/utils/extract-utils"

import { HEADER_MATCHER, PARSER_MATCHER, PLATFORM_MATCHER } from "./integrations"

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
  // Parse CSV
  await progress([undefined, `Extracting rows...`])
  const rows = splitRows(text.trim())

  const header = sanitizeHeader(rows[0])
  const parserId = HEADER_MATCHER[header]
  const parser = PARSER_MATCHER[parserId]
  const platform = PLATFORM_MATCHER[parserId]

  if (!parser) {
    throw new Error(`File import unsupported, unknown header: ${header}`)
  }

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
      const { logs: newLogs, txns } = parser(row, index, _fileImportId, parserContext, header)

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
    integration: parserId,
    logs: logs.length,
    operations: Object.keys(operationMap) as AuditLogOperation[],
    // pairList: Array.from(pairList),
    platform,
    rows: rows.length - 1,
    transactions: transactions.length,
    wallets: Object.keys(walletMap),
  }

  return { logs, metadata, transactions }
}

export function extractColumnsFromRow(row: string, colNumber?: number): string[] {
  // A regex that matches content inside quotes or non-comma/non-semicolon characters,
  // accounting for commas or semicolons within quotes
  let columns: string[] = row.match(/(".*?"|[^",;]+)(?=\s*[;,]|\s*$)/g) || []

  if (typeof colNumber === "number" && columns.length !== colNumber) {
    columns = row.split(";")
  }

  // Remove quotes and handle escaped quotes
  columns = columns.map((column) => {
    if (column.startsWith('"') && column.endsWith('"')) {
      // Remove surrounding quotes and replace escaped quotes ("" -> ")
      column = column.slice(1, -1).replace(/""/g, '"')
    }

    // Remove escaped commas (\, -> ,)
    column = column.replace(/\\,/g, ",")
    return column
  })

  if (typeof colNumber === "number" && columns.length !== colNumber) {
    console.log(columns)
    throw new Error(`Invalid number of columns: expected ${colNumber}, received ${columns.length}`)
  }

  return columns
}

export function splitRows(text: string): string[] {
  // OLD version which is slow
  // return text.trim().split(/\r?\n(?=(?:[^"]*"[^"]*")*[^"]*$)/)

  const rows = []
  let currentRow = ""
  let insideQuotes = false
  let i = 0

  while (i < text.length) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      insideQuotes = !insideQuotes
    }

    if (!insideQuotes && char === "\n") {
      rows.push(currentRow)
      currentRow = ""
    } else if (!insideQuotes && char === "\r" && nextChar === "\n") {
      rows.push(currentRow)
      currentRow = ""
      i++ // Skip the '\n' in '\r\n'
    } else {
      currentRow += char
    }

    i++
  }

  if (currentRow) {
    rows.push(currentRow)
  }

  return rows
}
