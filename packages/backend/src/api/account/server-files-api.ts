import { NewServerFile, ServerFile, SqlParam, SubscriptionChannel } from "src/interfaces"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"
import { writesAllowed } from "src/utils/utils"

import { getAccount } from "../accounts-api"
import { getValue, setValue } from "./kv-api"

const SCHEMA_VERSION = 1

export async function getAccountWithServerFiles(accountName: string) {
  const account = await getAccount(accountName)
  if (!writesAllowed) return account

  const schemaVersion = await getValue<number>(accountName, `server_files_schema_version`, 0)

  if (schemaVersion < 1) {
    await account.execute(sql`
      CREATE TABLE IF NOT EXISTS server_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        scheduledAt INTEGER NOT NULL,
        status TEXT,
        progress INTEGER,
        startedAt INTEGER,
        completedAt INTEGER,
        deletedAt INTEGER,
        metadata JSON,
        createdBy TEXT NOT NULL
      );
    `)
  }
  if (schemaVersion !== SCHEMA_VERSION) {
    await setValue(accountName, `server_files_schema_version`, SCHEMA_VERSION)
  }
  return account
}

export async function getServerFiles(
  accountName: string,
  query = "SELECT * FROM server_files ORDER BY id DESC",
  params?: SqlParam[]
): Promise<ServerFile[]> {
  const account = await getAccountWithServerFiles(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        name: row[1],
        description: row[2],
        scheduledAt: row[3],
        status: row[4],
        progress: row[5],
        startedAt: row[6],
        completedAt: row[7],
        deletedAt: row[8],
        metadata: JSON.parse(row[9] as string),
        createdBy: row[10],
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as ServerFile
    })
  } catch (error) {
    if (!writesAllowed) return []
    throw new Error(`Failed to query server files: ${error}`)
  }
}

export async function getServerFile(accountName: string, id: number) {
  const records = await getServerFiles(accountName, "SELECT * FROM server_files WHERE id = ?", [id])
  return records[0]
}

export async function upsertServerFiles(accountName: string, records: NewServerFile[]) {
  const account = await getAccountWithServerFiles(accountName)

  try {
    const results = await account.executeMany(
      `INSERT OR REPLACE INTO server_files (
        id, name, description, scheduledAt, status, progress, startedAt, completedAt, deletedAt, metadata, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      records.map((record) => [
        record.id || null,
        record.name,
        record.description || null,
        record.scheduledAt,
        record.status || "scheduled",
        record.progress || null,
        record.startedAt || null,
        record.completedAt || null,
        record.deletedAt || null,
        JSON.stringify(record.metadata || {}),
        record.createdBy,
      ])
    )

    account.eventEmitter.emit(SubscriptionChannel.ServerFiles)

    const ids = results.map((result) => result[0])
    const placeholders = ids.map(() => "?").join(",")

    return await getServerFiles(
      accountName,
      `SELECT * FROM server_files WHERE id IN (${placeholders})`,
      ids
    )
  } catch (error) {
    throw new Error(`Failed to add or replace server files: ${error}`)
  }
}

export async function upsertServerFile(accountName: string, record: NewServerFile) {
  const results = await upsertServerFiles(accountName, [record])
  return results[0]
}

export async function patchServerFile(accountName: string, id: number, patch: Partial<ServerFile>) {
  const existing = await getServerFile(accountName, id)
  const newValue = { ...existing, ...patch }
  await upsertServerFiles(accountName, [newValue])
}

export async function countServerFiles(
  accountName: string,
  query = "SELECT COUNT(*) FROM server_files",
  params?: SqlParam[]
): Promise<number> {
  const account = await getAccountWithServerFiles(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    if (!writesAllowed) return 0
    throw new Error(`Failed to count server files: ${error}`)
  }
}

export async function subscribeToServerFiles(accountName: string, callback: () => void) {
  return createSubscription(accountName, SubscriptionChannel.ServerFiles, callback)
}
