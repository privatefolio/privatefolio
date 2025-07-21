import { EventCause, SqlParam, SubscriptionChannel, Tag } from "src/interfaces"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { writesAllowed } from "src/utils/environment-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"

import { getAccount } from "../accounts-api"
import { getValue, setValue } from "./kv-api"

const SCHEMA_VERSION = 1

export async function getAccountWithTags(accountName: string) {
  const account = await getAccount(accountName)
  if (!writesAllowed) return account

  const schemaVersion = await getValue<number>(accountName, `tags_schema_version`, 0)

  if (schemaVersion < 1) {
    await account.execute(sql`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY,
        name VARCHAR UNIQUE NOT NULL
      );
    `)

    await account.execute(sql`
      CREATE TABLE IF NOT EXISTS audit_log_tags (
        audit_log_id VARCHAR NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (audit_log_id, tag_id),
        FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id),
        FOREIGN KEY (tag_id) REFERENCES tags(id)
      );
    `)

    await account.execute(sql`
      CREATE TABLE IF NOT EXISTS transaction_tags (
        transaction_id VARCHAR NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (transaction_id, tag_id),
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (tag_id) REFERENCES tags(id)
      );
    `)
  }
  if (schemaVersion !== SCHEMA_VERSION) {
    await setValue(accountName, `tags_schema_version`, SCHEMA_VERSION)
  }

  return account
}

/**
 * Retrieves tags based on the given query and parameters.
 */
export async function getTags(
  accountName: string,
  query = "SELECT id, name FROM tags ORDER BY id ASC",
  params?: SqlParam[]
): Promise<Tag[]> {
  const account = await getAccountWithTags(accountName)
  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      const tag = {
        id: row[0],
        name: row[1],
      }
      transformNullsToUndefined(tag)
      return tag as Tag
    })
  } catch (error) {
    if (!writesAllowed) return []
    throw new Error(`Failed to query tags: ${error}`)
  }
}

/**
 * Retrieves a single tag by its id.
 */
export async function getTag(accountName: string, id: number): Promise<Tag | undefined> {
  const records = await getTags(accountName, "SELECT id, name FROM tags WHERE id = ?", [id])
  return records[0]
}

/**
 * Inserts multiple tags (ignoring duplicates) and returns the inserted or existing tags.
 */
export async function upsertTags(accountName: string, tags: string[]): Promise<Tag[]> {
  const account = await getAccountWithTags(accountName)
  try {
    await account.executeMany(
      `INSERT OR IGNORE INTO tags (name) VALUES (?)`,
      tags.map((tag) => [tag])
    )
    const placeholders = tags.map(() => "?").join(", ")
    const result = await getTags(
      accountName,
      `SELECT id, name FROM tags WHERE name IN (${placeholders}) ORDER BY id ASC`,
      tags
    )
    account.eventEmitter.emit(SubscriptionChannel.Tags, EventCause.Created)
    return result
  } catch (error) {
    throw new Error(`Failed to upsert tags: ${error}`)
  }
}

/**
 * Inserts a single tag (using upsertTags) and returns it.
 */
export async function upsertTag(accountName: string, tag: string): Promise<Tag> {
  const tags = await upsertTags(accountName, [tag])
  if (tags.length !== 1) {
    throw new Error(`Failed to retrieve tag: ${tag}`)
  }
  return tags[0]
}

export async function updateTag(accountName: string, id: number, name: string): Promise<void> {
  const account = await getAccountWithTags(accountName)
  try {
    await account.execute("UPDATE tags SET name = ? WHERE id = ?", [name, id])
    account.eventEmitter.emit(SubscriptionChannel.Tags, EventCause.Updated)
  } catch (error) {
    throw new Error(`Failed to update tag: ${error}`)
  }
}

export async function deleteTag(accountName: string, id: number): Promise<void> {
  const account = await getAccountWithTags(accountName)
  try {
    await account.execute("DELETE FROM tags WHERE id = ?", [id])
    account.eventEmitter.emit(SubscriptionChannel.Tags, EventCause.Deleted)
  } catch (error) {
    throw new Error(`Failed to delete tag: ${error}`)
  }
}

export async function assignTagToAuditLog(
  accountName: string,
  auditLogId: string,
  tagName: string
): Promise<void> {
  const account = await getAccountWithTags(accountName)
  try {
    const tag = await upsertTag(accountName, tagName)
    await account.execute(
      `INSERT OR IGNORE INTO audit_log_tags (audit_log_id, tag_id) VALUES (?, ?)`,
      [auditLogId, tag.id]
    )
    account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Updated)
  } catch (error) {
    throw new Error(`Failed to assign tag '${tagName}' to audit log ${auditLogId}: ${error}`)
  }
}

export async function assignTagToTransaction(
  accountName: string,
  transactionId: string,
  tagName: string
): Promise<void> {
  const account = await getAccountWithTags(accountName)
  try {
    const tag = await upsertTag(accountName, tagName)
    await account.execute(
      `INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`,
      [transactionId, tag.id]
    )
    account.eventEmitter.emit(SubscriptionChannel.Transactions, EventCause.Updated, transactionId)
  } catch (error) {
    throw new Error(`Failed to assign tag '${tagName}' to transaction ${transactionId}: ${error}`)
  }
}

export async function assignTagToTrade(
  accountName: string,
  tradeId: string,
  tagName: string
): Promise<void> {
  const account = await getAccountWithTags(accountName)
  try {
    const tag = await upsertTag(accountName, tagName)
    await account.execute("INSERT OR IGNORE INTO trade_tags (trade_id, tag_id) VALUES (?, ?)", [
      tradeId,
      tag.id,
    ])
    account.eventEmitter.emit(SubscriptionChannel.Trades, EventCause.Updated, tradeId)
  } catch (error) {
    throw new Error(`Failed to assign tag '${tagName}' to trade ${tradeId}: ${error}`)
  }
}

export async function removeTagFromAuditLog(
  accountName: string,
  auditLogId: string,
  tagId: number
): Promise<void> {
  const account = await getAccountWithTags(accountName)
  try {
    await account.execute(`DELETE FROM audit_log_tags WHERE audit_log_id = ? AND tag_id = ?`, [
      auditLogId,
      tagId,
    ])
    account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Updated)
  } catch (error) {
    throw new Error(`Failed to remove tag id ${tagId} from audit log ${auditLogId}: ${error}`)
  }
}

export async function removeTagFromTransaction(
  accountName: string,
  transactionId: string,
  tagId: number
): Promise<void> {
  const account = await getAccountWithTags(accountName)
  try {
    await account.execute(`DELETE FROM transaction_tags WHERE transaction_id = ? AND tag_id = ?`, [
      transactionId,
      tagId,
    ])
    account.eventEmitter.emit(SubscriptionChannel.Transactions, EventCause.Updated, transactionId)
  } catch (error) {
    throw new Error(`Failed to remove tag id ${tagId} from transaction ${transactionId}: ${error}`)
  }
}

export async function removeTagFromTrade(
  accountName: string,
  tradeId: string,
  tagId: number
): Promise<void> {
  const account = await getAccountWithTags(accountName)
  try {
    await account.execute("DELETE FROM trade_tags WHERE trade_id = ? AND tag_id = ?", [
      tradeId,
      tagId,
    ])
    account.eventEmitter.emit(SubscriptionChannel.Trades, EventCause.Updated, tradeId)
  } catch (error) {
    throw new Error(`Failed to remove tag id ${tagId} from trade ${tradeId}: ${error}`)
  }
}

export async function getTagsForAuditLog(accountName: string, auditLogId: string) {
  return getTags(
    accountName,
    `SELECT tags.id, tags.name 
     FROM tags
     INNER JOIN audit_log_tags ON audit_log_tags.tag_id = tags.id
     WHERE audit_log_tags.audit_log_id = ?`,
    [auditLogId]
  )
}

export async function getTagsForTransaction(accountName: string, transactionId: string) {
  return getTags(
    accountName,
    `SELECT tags.id, tags.name 
     FROM tags
     INNER JOIN transaction_tags ON transaction_tags.tag_id = tags.id
     WHERE transaction_tags.transaction_id = ?`,
    [transactionId]
  )
}

export async function getTagsForTrade(accountName: string, tradeId: string) {
  return getTags(
    accountName,
    `SELECT tags.id, tags.name 
     FROM tags
     INNER JOIN trade_tags ON trade_tags.tag_id = tags.id
     WHERE trade_tags.trade_id = ?`,
    [tradeId]
  )
}

export async function subscribeToTags(accountName: string, callback: (cause: EventCause) => void) {
  return createSubscription(accountName, SubscriptionChannel.Tags, callback)
}
