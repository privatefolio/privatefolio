import { Serializable } from "src/backend-server"
import { SqlParam, SubscriptionChannel } from "src/interfaces"
import { createSubscription } from "src/utils/sub-utils"

import { getAccount } from "../accounts-api"

export async function setValue(key: string, value: unknown, accountName: string) {
  const account = await getAccount(accountName)
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
  const account = await getAccount(accountName)
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
