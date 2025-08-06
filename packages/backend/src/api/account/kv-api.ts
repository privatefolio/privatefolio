import { Serializable } from "src/backend-server"
import { SqlParam, SubscriptionChannel } from "src/interfaces"
import { encryptValue } from "src/utils/jwt-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"

import { getAccount } from "../accounts-api"
import { readSecrets } from "../auth-http-api"

export async function getAccountWithKeyValue(accountName: string) {
  const account = await getAccount(accountName)

  const tables = await account.execute(sql`
    SELECT name FROM sqlite_master WHERE type='table' AND name='key_value'
  `)

  if (tables.length === 0) {
    await account.execute(sql`
      CREATE TABLE key_value (
        key VARCHAR PRIMARY KEY,
        value JSON
      )
    `)
  }

  return account
}

export async function setValue(accountName: string, key: string, value: unknown) {
  const account = await getAccountWithKeyValue(accountName)
  await account.execute("INSERT OR REPLACE INTO key_value (key, value) VALUES (?, ?)", [
    key,
    value as SqlParam,
  ])
  account.eventEmitter.emit(SubscriptionChannel.KeyValue, key, value)
}

export async function getValue<T>(
  accountName: string,
  key: string,
  defaultValue: T extends Serializable ? T : null = null
): Promise<T extends Serializable ? T : null> {
  const account = await getAccountWithKeyValue(accountName)
  const result = await account.execute("SELECT * FROM key_value WHERE key = ?", [key])
  const existing = result[0] as unknown as [string, T][]
  return result.length > 0 ? (existing[1] as T extends Serializable ? T : null) : defaultValue
}

export async function subscribeToKV<T>(
  accountName: string,
  key: string,
  callback: (value: T) => void
) {
  function listener(k: string, value: T) {
    if (key === k) {
      callback(value)
    }
  }

  return createSubscription(accountName, SubscriptionChannel.KeyValue, listener)
}

export async function setEncryptedValue(accountName: string, key: string, value: string) {
  if (!value) {
    await setValue(accountName, key, null)
    return
  }

  const secrets = await readSecrets()
  if (!secrets) {
    throw new Error("Authentication secrets not found. Cannot encrypt value.")
  }

  const encryptedValue = await encryptValue(value, secrets.jwtSecret)
  await setValue(accountName, key, encryptedValue)
}
