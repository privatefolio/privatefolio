import { SERVER_DB_FILE } from "src/settings/settings"
import { QueryExecutor } from "src/sqlite/bun-sqlite"
import { createSqliteDatabaseConnection } from "src/sqlite/sqlite"

import { getServerDatabaseWithHealthMetrics } from "./server-health-api"
import { getServerDatabaseWithKeyValue } from "./server-kv-api"

export async function getServerDatabase(): Promise<QueryExecutor> {
  if (!connection) {
    connection = await createSqliteDatabaseConnection(SERVER_DB_FILE, "server")
  }

  return connection
}

let connection: QueryExecutor | null = null

export async function migrateServerDatabase() {
  await getServerDatabaseWithHealthMetrics()
  await getServerDatabaseWithKeyValue()
}
