import { access, readFile } from "fs/promises"
import { join } from "path"
import { getAccount } from "src/api/accounts-api"
import { HEADER_MATCHER, PARSER_MATCHER } from "src/extensions/file-imports/matchers"
import { parseCsv, sanitizeHeader } from "src/extensions/file-imports/parse-csv"
import {
  EventCause,
  FileImport,
  ProgressCallback,
  ServerFile,
  SqlParam,
  SubscriptionChannel,
  TaskCompletionCallback,
  TaskPriority,
  TaskTrigger,
  Timestamp,
} from "src/interfaces"
import { FILES_LOCATION } from "src/settings/settings"
import { splitRows } from "src/utils/csv-utils"
import { formatDate } from "src/utils/formatting-utils"
import { createSubscription } from "src/utils/sub-utils"
import { hashString, noop } from "src/utils/utils"

import { countAuditLogs, upsertAuditLogs } from "./audit-logs-api"
import { invalidateBalances } from "./balances-api"
import { invalidateNetworth } from "./networth-api"
import { getServerFile } from "./server-files-api"
import { enqueueTask } from "./server-tasks-api"
import { invalidateTradePnl, invalidateTrades } from "./trades-api"
import { countTransactions, upsertTransactions } from "./transactions-api"

async function readFileImportText(accountName: string, fileRecord: ServerFile) {
  const filePath = join(FILES_LOCATION, accountName, String(fileRecord.id))
  await access(filePath)
  const text = await readFile(filePath, "utf-8")
  return text
}

export async function getFileImportRequirements(accountName: string, fileRecord: ServerFile) {
  const text = await readFileImportText(accountName, fileRecord)
  const rows = splitRows(text)
  const header = sanitizeHeader(rows[0])
  const parserId = HEADER_MATCHER[header]
  const parser = PARSER_MATCHER[parserId]
  return parser?.requirements
}

export async function importFile(
  accountName: string,
  fileRecord: ServerFile,
  parserContext: Record<string, unknown> = {},
  progress: ProgressCallback = noop
): Promise<FileImport> {
  const account = await getAccount(accountName)

  const { name } = fileRecord
  const { type, lastModified, size } = fileRecord.metadata

  await progress([0, `Reading file "${name}" from disk`])
  const text = await readFileImportText(accountName, fileRecord)
  await progress([10, `Read file "${name}" from disk`])

  if (type !== "text/csv") {
    throw new Error("Error reading file: not .csv")
  }

  // TESTME TODO2 Looks like on mobile, lastModified is set to Date.now()
  const id = hashString(`fi_${name}_${size}_${lastModified}`)
  // const id = hashString(`fi_${name}_${size}`)

  await progress([11, `Saving file import metadata under the id ${id}`])

  try {
    await account.execute(
      `INSERT INTO file_imports (id, lastModified, name, size) VALUES (?, ?, ?, ?)`,
      [id, lastModified, name, size]
    )
  } catch {
    throw new Error(`You cannot import the same file twice.`)
  }

  try {
    await progress([12, `Parsing file ${name}`])
    const { metadata, logs, transactions } = await parseCsv(text, id, progress, parserContext)

    await progress([60, `Saving ${logs.length} audit logs to disk`])
    await upsertAuditLogs(accountName, logs)

    await progress([80, `Saving ${transactions.length} transactions to disk`])
    await upsertTransactions(accountName, transactions)

    let oldestTimestamp: Timestamp | undefined
    for (const log of logs) {
      if (!oldestTimestamp || log.timestamp < oldestTimestamp) {
        oldestTimestamp = log.timestamp
      }
    }

    if (oldestTimestamp) {
      const newCursor = oldestTimestamp - (oldestTimestamp % 86400000) - 86400000
      await progress([25, `Setting balances cursor to ${formatDate(newCursor)}`])
      await invalidateBalances(accountName, newCursor)
      await invalidateNetworth(accountName, newCursor)
      await invalidateTrades(accountName, newCursor)
      await invalidateTradePnl(accountName, newCursor)
    }

    await account.execute(`UPDATE file_imports SET timestamp = ?, meta = ? WHERE id = ?`, [
      new Date().getTime(),
      JSON.stringify(metadata),
      id,
    ])

    const fileImport = await getFileImport(accountName, id)
    account.eventEmitter.emit(SubscriptionChannel.FileImports, EventCause.Created, fileImport)

    return fileImport
  } catch (error) {
    await account.execute(`DELETE FROM file_imports WHERE id = ?`, [id])
    throw error
  }
}

export async function getFileImports(
  accountName: string,
  query = "SELECT * FROM file_imports ORDER BY timestamp DESC",
  params?: SqlParam[]
) {
  const account = await getAccount(accountName)
  try {
    const result = await account.execute(query, params)
    return result.map((row) => ({
      id: row[0] as string,
      lastModified: row[1] as number,
      meta: JSON.parse(row[5] as string),
      name: row[2] as string,
      size: row[3] as number,
      timestamp: row[4] as number,
    })) satisfies FileImport[]
  } catch (error) {
    throw new Error(`Failed to query file imports: ${error}`)
  }
}
export async function getFileImport(accountName: string, id: string) {
  const records = await getFileImports(accountName, "SELECT * FROM file_imports WHERE id = ?", [id])
  return records[0]
}

export async function countFileImports(
  accountName: string,
  query = "SELECT COUNT(*) FROM file_imports",
  params?: SqlParam[]
): Promise<number> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    throw new Error(`Failed to count file imports: ${error}`)
  }
}

export async function deleteFileImport(
  accountName: string,
  fileImport: FileImport,
  progress: ProgressCallback = noop
) {
  await progress([0, `Removing file import with id ${fileImport.id}`])
  const account = await getAccount(accountName)

  const oldestTimestamp = (
    await account.execute(
      `SELECT timestamp FROM audit_logs WHERE fileImportId = ? ORDER BY timestamp ASC LIMIT 1`,
      [fileImport.id]
    )
  )[0]?.[0] as Timestamp | undefined

  const auditLogsCount = await countAuditLogs(
    accountName,
    `SELECT COUNT(*) FROM audit_logs WHERE fileImportId = ?`,
    [fileImport.id]
  )
  await progress([0, `Removing ${auditLogsCount} audit logs`])
  await account.execute(`DELETE FROM audit_logs WHERE fileImportId = ?`, [fileImport.id])
  account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Deleted)

  if (oldestTimestamp) {
    const newCursor = oldestTimestamp - (oldestTimestamp % 86400000) - 86400000
    await progress([25, `Setting balances cursor to ${formatDate(newCursor)}`])
    await invalidateBalances(accountName, newCursor)
    await progress([25, `Setting networth cursor to ${formatDate(newCursor)}`])
    await invalidateNetworth(accountName, newCursor)
  }

  const transactionsCount = await countTransactions(
    accountName,
    `SELECT COUNT(*) FROM transactions WHERE fileImportId = ?`,
    [fileImport.id]
  )
  await progress([50, `Removing ${transactionsCount} transactions`])
  await account.execute(`DELETE FROM transactions WHERE fileImportId = ?`, [fileImport.id])

  await account.execute(`DELETE FROM file_imports WHERE id = ?`, [fileImport.id])
  await progress([100, `Removed file import with id ${fileImport.id}`])

  account.eventEmitter.emit(SubscriptionChannel.FileImports, EventCause.Deleted, fileImport)

  return auditLogsCount
}

export async function subscribeToFileImports(
  accountName: string,
  callback: (cause: EventCause, fileImport: FileImport) => void
) {
  return createSubscription(accountName, SubscriptionChannel.FileImports, callback)
}

export async function enqueueImportFile(
  accountName: string,
  trigger: TaskTrigger,
  fileId: number,
  parserContext?: Record<string, unknown>
) {
  const fileRecord = await getServerFile(accountName, fileId)
  return enqueueTask(accountName, {
    description: `Importing "${fileRecord.name}".`,
    determinate: true,
    function: (progress) => importFile(accountName, fileRecord, parserContext, progress),
    name: `Import "${fileRecord.name}"`,
    priority: TaskPriority.VeryHigh,
    trigger,
  })
}

export async function enqueueRemoveFileImport(
  accountName: string,
  trigger: TaskTrigger,
  fileImportId: string,
  onCompletion?: TaskCompletionCallback
) {
  const fileImport = await getFileImport(accountName, fileImportId)
  return enqueueTask(accountName, {
    description: `Remove "${fileImport.name}", alongside its audit logs and transactions.`,
    determinate: true,
    function: async (progress) => {
      await deleteFileImport(accountName, fileImport, progress)
    },
    name: `Remove file import`,
    onCompletion,
    priority: TaskPriority.VeryHigh,
    trigger,
  })
}
