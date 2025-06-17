import { Database } from "bun:sqlite"
import { isDebug, isDevelopment, isTestEnvironment } from "src/utils/environment-utils"
import { getPrefix } from "src/utils/utils"

export type SQLiteCompatibleType = boolean | string | number | null | Uint8Array

export type QueryExecutor = {
  close(): Promise<void>
  execute(query: string, params?: SQLiteCompatibleType[]): Promise<SQLiteCompatibleType[][]>
  executeMany(query: string, params?: SQLiteCompatibleType[][]): Promise<SQLiteCompatibleType[][]>
}

export async function createQueryExecutor(
  databaseFilePath: string,
  accountName: string
): Promise<QueryExecutor> {
  const db = new Database(databaseFilePath)

  async function executeFn(
    query: string,
    params: SQLiteCompatibleType[] = []
  ): Promise<SQLiteCompatibleType[][]> {
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
        console.log(
          getPrefix(accountName),
          `Query took ${durationMs.toFixed(3)}ms`,
          query.slice(0, 80).replace(/\n/g, "").trim()
        )
      }
      return rows
    } catch (error) {
      if (!isTestEnvironment) console.error(error)
      throw new Error(`Failed to execute query: ${query}, error: ${error}`)
    }
  }

  async function executeManyFn(
    query: string,
    params: SQLiteCompatibleType[][] = []
  ): Promise<SQLiteCompatibleType[][]> {
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
    async close() {
      db.close()
    },
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
