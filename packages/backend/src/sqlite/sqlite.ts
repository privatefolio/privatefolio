import { Logger } from "@logtape/logtape"
import { useBunSqlite } from "src/utils/environment-utils"

export async function createSqliteDatabaseConnection(
  databaseFilePath: string,
  accountName: string,
  logger?: Logger
) {
  if (useBunSqlite) {
    const { createQueryExecutor } = await import("./bun-sqlite")
    const db = await createQueryExecutor(databaseFilePath, accountName, logger)
    return db
  }

  const { createQueryExecutor } = await import("./nodejs-sqlite")
  const db = await createQueryExecutor(databaseFilePath, accountName, logger)
  return db

  // const { createQueryExecutor, createSQLiteAPI } = await import("./webworker-sqlite")

  // const sqlite3 = await createSQLiteAPI()
  // const db = await createQueryExecutor(sqlite3, databaseName)
  // return db
}
