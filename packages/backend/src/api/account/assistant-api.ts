import {
  ChatConversation,
  ChatMessage,
  EventCause,
  ServerFile,
  SqlParam,
  TaskPriority,
  TaskTrigger,
} from "src/interfaces"
import { createCsvString } from "src/utils/csv-utils"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { writesAllowed } from "src/utils/environment-utils"
import { saveFile } from "src/utils/file-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"

import { SubscriptionChannel } from "../../interfaces"
import { getAccount } from "../accounts-api"
import { getValue, setValue } from "./kv-api"
import { enqueueTask } from "./server-tasks-api"

const SCHEMA_VERSION = 1

export async function getAccountWithChatHistory(accountName: string) {
  const account = await getAccount(accountName)
  if (!writesAllowed) return account

  const schemaVersion = await getValue(accountName, `chat_history_schema_version`, 0)
  if (schemaVersion < SCHEMA_VERSION) {
    // Drop existing table to recreate with new schema
    await account.execute(sql`DROP TABLE IF EXISTS chat_history`)

    await account.execute(sql`
      CREATE TABLE chat_history (
        id VARCHAR PRIMARY KEY,
        conversationId VARCHAR NOT NULL,
        role VARCHAR NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        message TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        tokens INTEGER,
        metadata TEXT,
        FOREIGN KEY (conversationId) REFERENCES conversations(id)
      );
    `)

    // Create indices for better query performance
    await account.execute(
      sql`CREATE INDEX idx_chat_history_conversation ON chat_history(conversationId)`
    )
    await account.execute(sql`CREATE INDEX idx_chat_history_timestamp ON chat_history(timestamp)`)

    await setValue(accountName, `chat_history_schema_version`, SCHEMA_VERSION)
  }

  return account
}

export async function getChatHistoryOrderQuery(ascending = false) {
  if (ascending) {
    return "ORDER BY timestamp ASC, id ASC"
  }
  return "ORDER BY timestamp DESC, id DESC"
}

export async function getChatHistory(
  accountName: string,
  query = "SELECT * FROM chat_history ORDER BY timestamp DESC, id DESC",
  params?: SqlParam[]
): Promise<ChatMessage[]> {
  const account = await getAccountWithChatHistory(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      const value = {
        conversationId: row[1],
        id: row[0],
        message: row[3],
        metadata: row[6],
        role: row[2],
        timestamp: row[4],
        tokens: row[5],
      }
      transformNullsToUndefined(value)
      return value as ChatMessage
    })
  } catch (error) {
    throw new Error(`Failed to query chat history: ${error}`)
  }
}

export async function getChatMessage(accountName: string, id: string) {
  const records = await getChatHistory(accountName, "SELECT * FROM chat_history WHERE id = ?", [id])
  return records[0]
}

export async function getChatHistoryByConversation(accountName: string, conversationId: string) {
  return getChatHistory(
    accountName,
    "SELECT * FROM chat_history WHERE conversationId = ? ORDER BY timestamp ASC, id ASC",
    [conversationId]
  )
}

export async function getRecentChatHistory(accountName: string, limit = 50) {
  return getChatHistory(
    accountName,
    "SELECT * FROM chat_history ORDER BY timestamp DESC, id DESC LIMIT ?",
    [limit]
  )
}

type NewChatMessage = Omit<ChatMessage, "id"> & { id?: string }

export async function upsertChatMessages(accountName: string, records: NewChatMessage[]) {
  const account = await getAccountWithChatHistory(accountName)

  try {
    await account.executeMany(
      `INSERT OR REPLACE INTO chat_history (
        id, conversationId, role, message, timestamp, tokens, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      records.map((record) => [
        record.id || crypto.randomUUID(),
        record.conversationId,
        record.role,
        record.message,
        record.timestamp,
        record.tokens || null,
        record.metadata || null,
      ])
    )

    account.eventEmitter.emit(SubscriptionChannel.ChatHistory, EventCause.Created)
  } catch (error) {
    throw new Error(`Failed to add or replace chat messages: ${error}`)
  }
}

export async function upsertChatMessage(accountName: string, record: NewChatMessage) {
  return upsertChatMessages(accountName, [record])
}

export async function patchChatMessage(
  accountName: string,
  id: string,
  patch: Partial<ChatMessage>
) {
  const existing = await getChatMessage(accountName, id)
  if (!existing) {
    throw new Error(`Chat message with id ${id} not found`)
  }
  const newValue = { ...existing, ...patch }
  await upsertChatMessage(accountName, newValue)
}

export async function deleteChatMessage(accountName: string, id: string) {
  const account = await getAccountWithChatHistory(accountName)

  try {
    await account.execute("DELETE FROM chat_history WHERE id = ?", [id])
    account.eventEmitter.emit(SubscriptionChannel.ChatHistory, EventCause.Deleted)
  } catch (error) {
    throw new Error(`Failed to delete chat message: ${error}`)
  }
}

export async function deleteChatHistoryByConversation(accountName: string, conversationId: string) {
  const account = await getAccountWithChatHistory(accountName)

  try {
    await account.execute("DELETE FROM chat_history WHERE conversationId = ?", [conversationId])
    account.eventEmitter.emit(SubscriptionChannel.ChatHistory, EventCause.Deleted)
  } catch (error) {
    throw new Error(`Failed to delete chat history for conversation: ${error}`)
  }
}

export async function countChatMessages(
  accountName: string,
  query = "SELECT COUNT(*) FROM chat_history",
  params?: SqlParam[]
): Promise<number> {
  const account = await getAccountWithChatHistory(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    throw new Error(`Failed to count chat messages: ${error}`)
  }
}

export async function subscribeToChatHistory(
  accountName: string,
  callback: (cause: EventCause) => void
) {
  return createSubscription(accountName, SubscriptionChannel.ChatHistory, callback)
}

export async function getConversationIds(
  accountName: string,
  query = "SELECT DISTINCT conversationId FROM chat_history ORDER BY conversationId ASC",
  params?: SqlParam[]
): Promise<string[]> {
  const account = await getAccountWithChatHistory(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => row[0] as string)
  } catch (error) {
    throw new Error(`Failed to query conversation IDs: ${error}`)
  }
}

export async function getChatRoles(
  accountName: string,
  query = "SELECT DISTINCT role FROM chat_history ORDER BY role ASC",
  params?: SqlParam[]
): Promise<string[]> {
  const account = await getAccountWithChatHistory(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => row[0] as string)
  } catch (error) {
    throw new Error(`Failed to query chat roles: ${error}`)
  }
}

function transformChatHistoryToCsv(chatHistory: ChatMessage[]) {
  const headers = ["id", "conversationId", "role", "message", "timestamp", "tokens", "metadata"]
  const rows = chatHistory.map((message) => [
    message.id,
    message.conversationId,
    message.role,
    message.message,
    new Date(message.timestamp).toISOString(),
    message.tokens?.toString() || "",
    message.metadata || "",
  ])
  return [headers, ...rows]
}

export async function enqueueExportChatHistory(accountName: string, trigger: TaskTrigger) {
  return new Promise<ServerFile>((resolve, reject) => {
    enqueueTask(accountName, {
      description: "Export all chat history.",
      determinate: true,
      function: async (progress) => {
        try {
          await progress([0, "Fetching all chat history"])
          const chatHistory = await getChatHistory(accountName)
          await progress([25, `Transforming ${chatHistory.length} messages to CSV`])
          const data = transformChatHistoryToCsv(chatHistory)
          await progress([50, `Saving ${chatHistory.length} messages to CSV`])
          const fileRecord = await saveFile(
            accountName,
            Buffer.from(createCsvString(data)),
            `${accountName}-chat-history.csv`,
            "text/csv;charset=utf-8;"
          )
          await progress([75, `Chat history exported to CSV`])
          resolve(fileRecord)
        } catch (error) {
          reject(error)
          throw error
        }
      },
      name: "Export all chat history",
      priority: TaskPriority.Low,
      trigger,
    })
  })
}

export async function getConversationSummaries(
  accountName: string,
  query = `
    SELECT 
      conversationId,
      MIN(timestamp) as startTime,
      MAX(timestamp) as lastTime,
      (SELECT message FROM chat_history ch1 WHERE ch1.conversationId = chat_history.conversationId ORDER BY timestamp ASC LIMIT 1) as firstMessage
    FROM chat_history 
    GROUP BY conversationId 
    ORDER BY lastTime DESC
  `,
  params?: SqlParam[]
): Promise<ChatConversation[]> {
  const account = await getAccountWithChatHistory(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        startTime: row[1],
        lastTime: row[2],
        firstMessage: row[3],
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as ChatConversation
    })
  } catch (error) {
    throw new Error(`Failed to query conversation summaries: ${error}`)
  }
}

export async function countConversations(
  accountName: string,
  query = "SELECT COUNT(DISTINCT conversationId) FROM chat_history",
  params?: SqlParam[]
): Promise<number> {
  const account = await getAccountWithChatHistory(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    throw new Error(`Failed to count conversations: ${error}`)
  }
}
