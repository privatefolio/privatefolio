import {
  EventCause,
  ServerFile,
  SqlParam,
  TaskPriority,
  TaskTrigger,
  Timestamp,
} from "src/interfaces"
import { transformAuditLogsToCsv } from "src/utils/csv-export-utils"
import { createCsvString } from "src/utils/csv-utils"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { writesAllowed } from "src/utils/environment-utils"
import { saveFile } from "src/utils/file-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"

import { AuditLog, AuditLogOperation, SubscriptionChannel } from "../../interfaces"
import { getAccount } from "../accounts-api"
import { getValue, setValue } from "./kv-api"
import { enqueueTask } from "./server-tasks-api"

const SCHEMA_VERSION = 3

export async function getAccountWithAuditLogs(accountName: string) {
  const account = await getAccount(accountName)
  if (!writesAllowed) return account

  const schemaVersion = await getValue(accountName, `audit_logs_schema_version`, 0)

  if (schemaVersion < SCHEMA_VERSION) {
    // Drop existing table to recreate with new schema
    await account.execute(sql`DROP TABLE IF EXISTS audit_logs`)

    await account.execute(sql`
      CREATE TABLE audit_logs (
        id VARCHAR PRIMARY KEY,
        assetId VARCHAR NOT NULL,
        balance VARCHAR,
        balanceN FLOAT GENERATED ALWAYS AS (CAST(balance AS REAL)) STORED,
        balanceWallet VARCHAR,
        balanceWalletN FLOAT GENERATED ALWAYS AS (CAST(balanceWallet AS REAL)) STORED,
        change VARCHAR NOT NULL,
        changeN FLOAT GENERATED ALWAYS AS (CAST(change AS REAL)) STORED,
        fileImportId VARCHAR,
        connectionId VARCHAR,
        importIndex INTEGER NOT NULL,
        operation VARCHAR NOT NULL,
        platformId VARCHAR NOT NULL,
        timestamp INTEGER NOT NULL,
        txId VARCHAR,
        wallet VARCHAR NOT NULL,
        FOREIGN KEY (assetId) REFERENCES assets(id),
        FOREIGN KEY (connectionId) REFERENCES connections(id),
        FOREIGN KEY (fileImportId) REFERENCES fileImports(id),
        FOREIGN KEY (txId) REFERENCES transactions(id)
      );
    `)

    await setValue(accountName, `audit_logs_schema_version`, SCHEMA_VERSION)
  }

  return account
}

export async function getAuditLogOrderQuery(ascending = false) {
  if (ascending) {
    return "ORDER BY timestamp ASC, changeN ASC, id ASC"
  }
  return "ORDER BY timestamp DESC, changeN DESC, id DESC"
}

export async function getAuditLogs(
  accountName: string,
  query = "SELECT * FROM audit_logs ORDER BY timestamp DESC, changeN DESC, id DESC",
  params?: SqlParam[]
): Promise<AuditLog[]> {
  const account = await getAccountWithAuditLogs(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        assetId: row[1],
        balance: row[2],
        balanceWallet: row[4],
        change: row[6],
        fileImportId: row[8],
        connectionId: row[9],
        importIndex: row[10],
        operation: row[11],
        platformId: row[12],
        timestamp: row[13],
        txId: row[14],
        wallet: row[15],
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as AuditLog
    })
  } catch (error) {
    if (!writesAllowed) return []
    throw new Error(`Failed to query audit logs: ${error}`)
  }
}

export async function getAuditLog(accountName: string, id: string) {
  const records = await getAuditLogs(accountName, "SELECT * FROM audit_logs WHERE id = ?", [id])
  return records[0]
}

export async function getAuditLogsByTxId(accountName: string, txId: string) {
  return getAuditLogs(accountName, "SELECT * FROM audit_logs WHERE txId = ?", [txId])
}

export async function upsertAuditLogs(accountName: string, records: AuditLog[]) {
  const account = await getAccountWithAuditLogs(accountName)

  try {
    await account.executeMany(
      `INSERT OR REPLACE INTO audit_logs (
      id, assetId, balance, balanceWallet, change, fileImportId, connectionId, 
      importIndex, operation, platformId, timestamp, txId, wallet
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      records.map((record) => [
        record.id,
        record.assetId,
        record.balance || null,
        record.balanceWallet || null,
        record.change,
        record.fileImportId || null,
        record.connectionId || null,
        record.importIndex,
        record.operation,
        record.platformId,
        record.timestamp,
        record.txId || null,
        record.wallet,
      ])
    )
    let oldestTimestamp = Date.now()
    for (const record of records) {
      if (record.timestamp < oldestTimestamp) oldestTimestamp = record.timestamp
    }

    account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Created, oldestTimestamp)
  } catch (error) {
    throw new Error(`Failed to add or replace audit logs: ${error}`)
  }
}

export async function upsertAuditLog(accountName: string, record: AuditLog) {
  return upsertAuditLogs(accountName, [record])
}

export async function patchAuditLog(accountName: string, id: string, patch: Partial<AuditLog>) {
  const existing = await getAuditLog(accountName, id)
  const newValue = { ...existing, ...patch }
  await upsertAuditLog(accountName, newValue)
}

export async function countAuditLogs(
  accountName: string,
  query = "SELECT COUNT(*) FROM audit_logs",
  params?: SqlParam[]
): Promise<number> {
  const account = await getAccountWithAuditLogs(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    if (!writesAllowed) return 0
    throw new Error(`Failed to count audit logs: ${error}`)
  }
}

export async function subscribeToAuditLogs(
  accountName: string,
  callback: (cause: EventCause, oldestTimestamp?: Timestamp) => void
) {
  return createSubscription(accountName, SubscriptionChannel.AuditLogs, callback)
}

export async function getMyPlatformIds(
  accountName: string,
  query = "SELECT DISTINCT platformId FROM audit_logs ORDER BY platformId ASC",
  params?: SqlParam[]
): Promise<string[]> {
  const account = await getAccountWithAuditLogs(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => row[0] as string)
  } catch (error) {
    if (!writesAllowed) return []
    throw new Error(`Failed to query platforms: ${error}`)
  }
}

export async function getWallets(
  accountName: string,
  query = "SELECT DISTINCT wallet FROM audit_logs ORDER BY wallet ASC",
  params?: SqlParam[]
): Promise<string[]> {
  const account = await getAccountWithAuditLogs(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => row[0] as string)
  } catch (error) {
    if (!writesAllowed) return []
    throw new Error(`Failed to query wallets: ${error}`)
  }
}

export async function getOperations(
  accountName: string,
  query = "SELECT DISTINCT operation FROM audit_logs ORDER BY operation ASC",
  params?: SqlParam[]
): Promise<AuditLogOperation[]> {
  const account = await getAccountWithAuditLogs(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => row[0] as AuditLogOperation)
  } catch (error) {
    if (!writesAllowed) return []
    throw new Error(`Failed to query operations: ${error}`)
  }
}

export async function enqueueExportAuditLogs(accountName: string, trigger: TaskTrigger) {
  return new Promise<ServerFile>((resolve, reject) => {
    enqueueTask(accountName, {
      //   abortable: true, TODO5
      description: "Export all audit logs.",
      determinate: true,
      function: async (progress) => {
        try {
          await progress([0, "Fetching all audit logs"])
          const auditLogs = await getAuditLogs(accountName)
          await progress([25, `Transforming ${auditLogs.length} audit logs to CSV`])
          const data = transformAuditLogsToCsv(auditLogs)
          await progress([50, `Saving ${auditLogs.length} audit logs to CSV`])
          const fileRecord = await saveFile(
            accountName,
            Buffer.from(createCsvString(data)),
            `${accountName}-audit-logs.csv`,
            "text/csv;charset=utf-8;"
          )
          await progress([75, `Audit logs exported to CSV`])
          resolve(fileRecord)
        } catch (error) {
          reject(error)
          throw error
        }
      },
      name: "Export all audit logs",
      priority: TaskPriority.Low,
      trigger,
    })
  })
}
