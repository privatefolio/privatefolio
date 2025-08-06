import { Serializable } from "src/backend-server"
import { SqlParam, SubscriptionChannel } from "src/interfaces"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"

import { getServerDatabase } from "./server-api"

export async function getServerDatabaseWithKeyValue() {
  const db = await getServerDatabase()

  const tables = await db.execute(sql`
    SELECT name FROM sqlite_master WHERE type='table' AND name='key_value'
  `)

  if (tables.length === 0) {
    await db.execute(sql`
      CREATE TABLE key_value (
        key VARCHAR PRIMARY KEY,
        value JSON
      )
    `)
  }

  return db
}

export async function setServerValue(key: string, value: unknown) {
  const db = await getServerDatabaseWithKeyValue()

  await db.execute("INSERT OR REPLACE INTO key_value (key, value) VALUES (?, ?)", [
    key,
    value as SqlParam,
  ])
}

export async function getServerValue<T>(
  key: string,
  defaultValue: T extends Serializable ? T : null = null
): Promise<T extends Serializable ? T : null> {
  const db = await getServerDatabaseWithKeyValue()

  const result = await db.execute("SELECT * FROM key_value WHERE key = ?", [key])
  const existing = result[0] as unknown as [string, T][]

  return result.length > 0 ? (existing[1] as T extends Serializable ? T : null) : defaultValue
}

export async function subscribeToServerKV<T>(key: string, callback: (value: T) => void) {
  function listener(k: string, value: T) {
    if (key === k) {
      callback(value)
    }
  }

  return createSubscription(undefined, SubscriptionChannel.ServerKeyValue, listener)
}
