import { open } from "sqlite"
import sqlite3 from "sqlite3"
import { isDevelopment, isTestEnvironment, writesAllowed } from "src/utils/environment-utils"
import { isReadQuery } from "src/utils/sql-utils"
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
  const db = await open({
    driver: sqlite3.Database,
    filename: databaseFilePath,
    mode: !writesAllowed ? sqlite3.OPEN_READONLY : sqlite3.OPEN_READWRITE,
  })

  async function executeFn(
    query: string,
    params: SQLiteCompatibleType[] = []
  ): Promise<SQLiteCompatibleType[][]> {
    if (!writesAllowed && !isReadQuery(query)) throw new Error("Illegal write query")
    try {
      const start = process.hrtime.bigint() // Start time in nanoseconds

      const rows: SQLiteCompatibleType[][] = []
      const stmt = await db.prepare(query)
      const result = await stmt.all(...params)
      for (const row of result) {
        rows.push(Object.values(row))
      }
      await stmt.finalize()

      const end = process.hrtime.bigint() // End time in nanoseconds
      const durationMs = Number(end - start) / 1_000_000 // Convert nanoseconds to milliseconds

      if (isDevelopment) {
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
    if (!writesAllowed && !isReadQuery(query)) throw new Error("Illegal write query")

    const results: SQLiteCompatibleType[][] = []

    // TODO2
    const asTransaction = false // params.length > 1

    if (asTransaction) await db.exec("BEGIN TRANSACTION")
    try {
      const stmt = await db.prepare(query)
      try {
        for (const paramSet of params) {
          const res = await stmt.run(...paramSet)
          results.push([res.lastID || null, res.changes || null])
        }
      } finally {
        await stmt.finalize()
      }
      if (asTransaction) await db.exec("COMMIT")
    } catch (error) {
      if (asTransaction) await db.exec("ROLLBACK")
      throw error
    }

    return results
  }

  return {
    async close() {
      await db.close()
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
