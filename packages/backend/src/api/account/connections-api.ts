import { getAddress } from "ethers"
import { SqlParam, TaskCompletionCallback } from "src/interfaces"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { createSubscription } from "src/utils/sub-utils"

import { syncBinance } from "../../extensions/connections/binance/binance-connector"
import { syncEtherscan } from "../../extensions/connections/etherscan/etherscan-connector"
import {
  AuditLogOperation,
  BinanceConnection,
  Connection,
  EtherscanConnection,
  EventCause,
  ProgressCallback,
  SubscriptionChannel,
  SyncResult,
  TaskPriority,
  TaskTrigger,
} from "../../interfaces"
import { hashString, noop } from "../../utils/utils"
import { getAccount } from "../accounts-api"
import { countAuditLogs, upsertAuditLogs } from "./audit-logs-api"
import { getValue, setValue } from "./kv-api"
import { enqueueTask } from "./server-tasks-api"
import { countTransactions, upsertTransactions } from "./transactions-api"

export async function getConnections(
  accountName: string,
  query = "SELECT * FROM connections",
  params?: SqlParam[]
) {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)

    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0] as string,
        address: row[1] as string,
        key: row[2] as string,
        label: row[3] as string,
        meta: JSON.parse(row[4] as string),
        options: JSON.parse(row[5] as string),
        extensionId: row[6] as string,
        platform: row[7] as string,
        secret: row[8] as string,
        syncedAt: row[9] as number,
        timestamp: row[10] as number,
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as Connection
    })
  } catch (error) {
    throw new Error(`Failed to query connections: ${error}`)
  }
}

export async function getConnection(accountName: string, id: string) {
  const records = await getConnections(accountName, "SELECT * FROM connections WHERE id = ?", [id])
  return records[0]
}

export async function countConnections(
  accountName: string,
  query = "SELECT COUNT(*) FROM connections",
  params?: SqlParam[]
): Promise<number> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    throw new Error(`Failed to count connections: ${error}`)
  }
}

type PartialProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type NewConnection = PartialProps<Connection, "id" | "timestamp" | "syncedAt">

function deriveConnectionId(record: NewConnection) {
  return hashString(
    `con_${record.platform}_${record.extensionId}_${record.address || record.key}_${record.label}`
  )
}

export async function upsertConnections(accountName: string, records: NewConnection[]) {
  const account = await getAccount(accountName)

  try {
    await account.executeMany(
      `INSERT OR REPLACE INTO connections (
        id, address, key, label, meta, options, extensionId, platform, secret, syncedAt, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      records.map((record) => [
        record.id || deriveConnectionId(record),
        record.address ? getAddress(record.address) : null,
        record.key || null,
        record.label || null,
        JSON.stringify(record.meta) || null,
        JSON.stringify(record.options) || null,
        record.extensionId,
        record.platform,
        record.secret || null,
        record.syncedAt || null,
        record.timestamp || new Date().getTime(),
      ])
    )
    account.eventEmitter.emit(SubscriptionChannel.Connections, EventCause.Created)
  } catch (error) {
    throw new Error(`Failed to add or replace connections: ${error}`)
  }

  const results = await getConnections(
    accountName,
    "SELECT * FROM connections WHERE id = ?",
    records.map((records) => records.id || deriveConnectionId(records))
  )
  for (const connection of results) {
    account.eventEmitter.emit(SubscriptionChannel.Connections, EventCause.Created, connection)
  }

  return results
}

export async function upsertConnection(accountName: string, record: NewConnection) {
  const results = await upsertConnections(accountName, [record])
  return results[0]
}

export async function resetConnection(
  accountName: string,
  connectionId: string,
  progress: ProgressCallback
) {
  const account = await getAccount(accountName)
  const connection = await getConnection(accountName, connectionId)

  const auditLogsCount = await countAuditLogs(
    accountName,
    `SELECT COUNT(*) FROM audit_logs WHERE connectionId = ?`,
    [connection.id]
  )
  await progress([0, `Removing ${auditLogsCount} audit logs`])
  await account.execute(`DELETE FROM audit_logs WHERE connectionId = ?`, [connection.id])

  const transactionsCount = await countTransactions(
    accountName,
    `SELECT COUNT(*) FROM transactions WHERE connectionId = ?`,
    [connection.id]
  )
  await progress([50, `Removing ${transactionsCount} transactions`])
  await account.execute(`DELETE FROM transactions WHERE connectionId = ?`, [connection.id])

  await setValue(`cursor_${connection.id}`, 0, accountName)

  connection.meta = {
    assetIds: [],
    logs: 0,
    operations: [],
    rows: 0,
    transactions: 0,
    wallets: [],
  }

  await upsertConnection(accountName, connection)

  account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Deleted)

  return auditLogsCount
}

export async function deleteConnection(
  accountName: string,
  connectionId: string,
  progress: ProgressCallback
) {
  const connection = await getConnection(accountName, connectionId)
  await progress([0, `Removing connection with id ${connection.id}`])
  const account = await getAccount(accountName)

  const auditLogsCount = await resetConnection(accountName, connectionId, progress)

  await account.execute(`DELETE FROM connections WHERE id = ?`, [connection.id])
  await progress([100, `Removal complete`])

  account.eventEmitter.emit(SubscriptionChannel.Connections, EventCause.Deleted, connection)
  return auditLogsCount
}

export async function subscribeToConnections(
  accountName: string,
  callback: (cause: EventCause, connection: Connection) => void
) {
  return createSubscription(accountName, SubscriptionChannel.Connections, callback)
}

export async function syncConnection(
  progress: ProgressCallback = noop,
  connectionId: string,
  accountName: string,
  debugMode = false,
  since?: string,
  until?: string,
  signal?: AbortSignal
) {
  const connection = await getConnection(accountName, connectionId)
  let result: SyncResult

  if (since === undefined) {
    since = (await getValue<string>(accountName, `cursor_${connection.id}`, "0")) as string
  }
  if (until === undefined) {
    until = String(Date.now())
  }

  if (connection.extensionId === "etherscan-connection") {
    result = await syncEtherscan(progress, connection as EtherscanConnection, since, until)
  } else if (connection.extensionId === "binance-connection") {
    result = await syncBinance(
      progress,
      connection as BinanceConnection,
      debugMode,
      since,
      until,
      signal
    )
  } else {
    throw new Error(`Unsupported extension: ${connection.extensionId}`)
  }

  // Save logs
  const logIds = Object.keys(result.logMap)

  if (logIds.length > 0) {
    await progress([60, `Saving ${logIds.length} audit logs to disk`])
    await upsertAuditLogs(accountName, Object.values(result.logMap))
  }

  // Save transactions
  const txIds = Object.keys(result.txMap)
  if (txIds.length > 0) {
    await progress([70, `Saving ${txIds.length} transactions to disk`])
    await upsertTransactions(accountName, Object.values(result.txMap))
  }

  // Save metadata
  const metadata: Connection["meta"] = {
    assetIds: Object.keys(result.assetMap),
    logs: logIds.length,
    operations: Object.keys(result.operationMap) as AuditLogOperation[],
    rows: result.rows,
    transactions: txIds.length,
    wallets: Object.keys(result.walletMap),
  }

  if (connection.meta && since !== "0") {
    connection.meta = {
      assetIds: [...new Set(connection.meta.assetIds.concat(metadata.assetIds))],
      logs: connection.meta.logs + metadata.logs,
      operations: [...new Set(connection.meta.operations.concat(metadata.operations))],
      rows: connection.meta.rows + metadata.rows,
      transactions: connection.meta.transactions + metadata.transactions,
      wallets: [...new Set(connection.meta.wallets.concat(metadata.wallets))],
    }
  } else {
    connection.meta = metadata
  }
  connection.syncedAt = new Date().getTime()

  await progress([80, `Saving metadata`])
  await upsertConnection(accountName, connection)

  // Set cursor
  if (result.rows > 0) {
    await progress([90, `Setting cursor to ${result.newCursor}`])
    await setValue(`cursor_${connection.id}`, result.newCursor, accountName)
  }

  return connection
}

export async function enqueueSyncAllConnections(
  accountName: string,
  trigger: TaskTrigger,
  debugMode?: boolean,
  onCompletion?: TaskCompletionCallback
) {
  const connections = await getConnections(accountName)

  for (const connection of connections) {
    await enqueueSyncConnection(accountName, trigger, connection.id, debugMode, onCompletion)
  }
}

export async function enqueueSyncConnection(
  accountName: string,
  trigger: TaskTrigger,
  connectionId: string,
  debugMode?: boolean,
  onCompletion?: TaskCompletionCallback
) {
  const connection = await getConnection(accountName, connectionId)
  return enqueueTask(accountName, {
    description: `Sync "${connection.address || connection.key}"`,
    determinate: true,
    function: async (progress, signal) => {
      await syncConnection(
        progress,
        connectionId,
        accountName,
        debugMode,
        undefined,
        undefined,
        signal
      )
    },
    name: "Sync connection",
    onCompletion,
    priority: TaskPriority.High,
    trigger,
  })
}

export async function enqueueResetConnection(
  accountName: string,
  trigger: TaskTrigger,
  connectionId: string
) {
  const connection = await getConnection(accountName, connectionId)
  return enqueueTask(accountName, {
    description: `Reset "${connection.address}"`,
    determinate: true,
    function: async (progress) => {
      await resetConnection(accountName, connectionId, progress)
    },
    name: "Reset connection",
    priority: TaskPriority.VeryHigh,
    trigger,
  })
}

export async function enqueueDeleteConnection(
  accountName: string,
  trigger: TaskTrigger,
  connectionId: string,
  onCompletion?: TaskCompletionCallback
) {
  const connection = await getConnection(accountName, connectionId)
  return enqueueTask(accountName, {
    description: `Remove "${connection.label}", alongside its audit logs and transactions.`,
    determinate: true,
    function: async (progress) => {
      await deleteConnection(accountName, connectionId, progress)
    },
    name: "Remove connection",
    onCompletion,
    priority: TaskPriority.Highest,
    trigger,
  })
}
