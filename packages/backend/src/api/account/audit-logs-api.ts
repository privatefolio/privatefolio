import { EventCause, ServerFile, SqlParam, TaskPriority, TaskTrigger } from "src/interfaces"
import { transformAuditLogsToCsv } from "src/utils/csv-export-utils"
import { createCsvString } from "src/utils/csv-utils"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { saveFile } from "src/utils/file-utils"
import { createSubscription } from "src/utils/sub-utils"

import { AuditLog, AuditLogOperation, SubscriptionChannel } from "../../interfaces"
import { getAccount } from "../accounts-api"
import { enqueueTask } from "./server-tasks-api"

export async function getAuditLogs(
  accountName: string,
  query = "SELECT * FROM audit_logs ORDER BY timestamp DESC, changeN DESC, id DESC",
  params?: SqlParam[]
): Promise<AuditLog[]> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        assetId: row[1],
        balance: row[2],
        change: row[4],
        fileImportId: row[6],
        connectionId: row[7],
        importIndex: row[8],
        operation: row[9],
        platform: row[10],
        timestamp: row[11],
        txId: row[12],
        wallet: row[13],
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as AuditLog
    })
  } catch (error) {
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
  const account = await getAccount(accountName)

  try {
    await account.executeMany(
      `INSERT OR REPLACE INTO audit_logs (
      id, assetId, balance, change, fileImportId, connectionId, 
      importIndex, operation, platform, timestamp, txId, wallet
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      records.map((record) => [
        record.id,
        record.assetId,
        record.balance || null,
        record.change,
        record.fileImportId || null,
        record.connectionId || null,
        record.importIndex,
        record.operation,
        record.platform,
        record.timestamp,
        record.txId || null,
        record.wallet,
      ])
    )
    // TODO8 this will help invalidating balances cursor
    // let earliestTimestamp = Date.now()
    // for (const record of records) {
    //   if (record.timestamp < earliestTimestamp) {
    //     earliestTimestamp = record.timestamp
    //   }
    // }

    account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Created)
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
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    throw new Error(`Failed to count audit logs: ${error}`)
  }
}

export async function subscribeToAuditLogs(
  accountName: string,
  callback: (cause: EventCause) => void
) {
  return createSubscription(accountName, SubscriptionChannel.AuditLogs, callback)
}

export async function getMyPlatformIds(
  accountName: string,
  query = "SELECT DISTINCT platform FROM audit_logs ORDER BY platform ASC",
  params?: SqlParam[]
): Promise<string[]> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => row[0] as string)
  } catch (error) {
    throw new Error(`Failed to query platforms: ${error}`)
  }
}

export async function getWallets(
  accountName: string,
  query = "SELECT DISTINCT wallet FROM audit_logs ORDER BY wallet ASC",
  params?: SqlParam[]
): Promise<string[]> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => row[0] as string)
  } catch (error) {
    throw new Error(`Failed to query wallets: ${error}`)
  }
}

export async function getOperations(
  accountName: string,
  query = "SELECT DISTINCT operation FROM audit_logs ORDER BY operation ASC",
  params?: SqlParam[]
): Promise<AuditLogOperation[]> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => row[0] as AuditLogOperation)
  } catch (error) {
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
