import { access, mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { DATA_LOCATION, SERVER_DB_FILENAME } from "src/settings/settings"
import { QueryExecutor } from "src/sqlite/bun-sqlite"
import { createSqliteDatabaseConnection } from "src/sqlite/sqlite"

import { getServerDatabaseWithHealthMetrics } from "./server-health-api"
import { getServerDatabaseWithKeyValue } from "./server-kv-api"

export async function getServerDatabase(): Promise<QueryExecutor> {
  // ensure the file exists
  const serverDbPath = join(DATA_LOCATION, SERVER_DB_FILENAME)
  try {
    await access(serverDbPath)
  } catch {
    await mkdir(DATA_LOCATION, { recursive: true })
    await writeFile(serverDbPath, "")
  }

  if (!connection) {
    connection = await createSqliteDatabaseConnection(serverDbPath, "server")
  }

  return connection
}

let connection: QueryExecutor | null = null

export async function migrateServerDatabase() {
  await getServerDatabaseWithHealthMetrics()
  await getServerDatabaseWithKeyValue()
}
