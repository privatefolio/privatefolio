import { Logger } from "@logtape/logtape"
import { Database } from "bun:sqlite"
import {
  isDebug,
  isDevelopment,
  isTestEnvironment,
  writesAllowed,
} from "src/utils/environment-utils"
import { logAndReportError } from "src/utils/error-utils"
import { ensureActiveAccount, isReadQuery } from "src/utils/sql-utils"

export type SQLiteCompatibleType = boolean | string | number | null | Uint8Array

export type QueryExecutor = {
  close(): Promise<void>
  execute(query: string, params?: SQLiteCompatibleType[]): Promise<SQLiteCompatibleType[][]>
  executeMany(query: string, params?: SQLiteCompatibleType[][]): Promise<SQLiteCompatibleType[][]>
}

export async function createQueryExecutor(
  databaseFilePath: string,
  accountName: string,
  logger?: Logger
): Promise<QueryExecutor> {
  await ensureActiveAccount(accountName)

  const db = new Database(databaseFilePath, {
    create: true,
    readonly: !writesAllowed, // doesn't work
    readwrite: writesAllowed, // doesn't work
  })

  const close = async () => {
    logger?.info("Closing database connection")
    db.exec("PRAGMA wal_checkpoint(FULL);")
    db.close(true)
    logger?.info("Closed database connection")
  }

  async function executeFn(
    query: string,
    params: SQLiteCompatibleType[] = []
  ): Promise<SQLiteCompatibleType[][]> {
    await ensureActiveAccount(accountName, close)
    if (!writesAllowed && !isReadQuery(query)) throw new Error("Illegal write query")
    try {
      const start = process.hrtime.bigint() // Start time in nanoseconds

      const rows: SQLiteCompatibleType[][] = []
      const stmt = db.prepare(query)
      const result = stmt.all(...params)
      for (const row of result) {
        rows.push(Object.values(row))
      }
      stmt.finalize()

      const end = process.hrtime.bigint() // End time in nanoseconds
      const durationMs = Number(end - start) / 1_000_000 // Convert nanoseconds to milliseconds

      if (isDevelopment && isDebug) {
        logger?.debug(`Query took ${durationMs.toFixed(3)}ms`, {
          query: query.slice(0, 80).replace(/\n/g, "").trim(),
        })
      }
      return rows
    } catch (error) {
      if (!isTestEnvironment && writesAllowed) {
        logAndReportError(error, "Failed to execute query", { query })
      }
      throw new Error(`Failed to execute query: ${query}, error: ${error}`)
    }
  }

  async function executeManyFn(
    query: string,
    params: SQLiteCompatibleType[][] = []
  ): Promise<SQLiteCompatibleType[][]> {
    await ensureActiveAccount(accountName, close)
    if (!writesAllowed && !isReadQuery(query)) throw new Error("Illegal write query")

    const results: SQLiteCompatibleType[][] = []

    // TODO3
    const asTransaction = false // params.length > 1

    if (asTransaction) db.exec("BEGIN TRANSACTION")
    try {
      const stmt = db.prepare(query)
      try {
        for (const paramSet of params) {
          const res = stmt.run(...paramSet)
          results.push([(res.lastInsertRowid as number) || null, res.changes || null])
        }
      } finally {
        stmt.finalize()
      }
      if (asTransaction) db.exec("COMMIT")
    } catch (error) {
      if (asTransaction) db.exec("ROLLBACK")
      throw error
    }

    return results
  }

  return {
    close,
    async execute(
      query: string,
      params?: SQLiteCompatibleType[]
    ): Promise<SQLiteCompatibleType[][]> {
      // Directly call the execute function since Node.js handles concurrency differently
      return executeFn(query, params)
    },
    async executeMany(
      query: string,
      params: SQLiteCompatibleType[][]
    ): Promise<SQLiteCompatibleType[][]> {
      return executeManyFn(query, params)
    },
  }
}
