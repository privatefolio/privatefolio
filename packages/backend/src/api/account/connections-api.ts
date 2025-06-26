import { getAddress } from "ethers"
import { SqlParam, TaskCompletionCallback } from "src/interfaces"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { sql } from "src/utils/sql-utils"
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
import { getExtension } from "./extensions-api"
import { getValue, setValue } from "./kv-api"
import { getPlatform } from "./platforms-api"
import { enqueueTask } from "./server-tasks-api"
import { countTransactions, upsertTransactions } from "./transactions-api"

const SCHEMA_VERSION = 5

async function getAccountWithConnections(accountName: string) {
  const schemaVersion = await getValue(accountName, `connections_schema_version`, 0)

  const account = await getAccount(accountName)

  if (schemaVersion < SCHEMA_VERSION) {
    await account.execute(sql`DROP TABLE IF EXISTS connections`)

    await account.execute(sql`
      CREATE TABLE connections (
        id VARCHAR PRIMARY KEY,
        connectionNumber INTEGER NOT NULL UNIQUE,
        address VARCHAR,
        key VARCHAR,
        meta JSON,
        options JSON,
        extensionId VARCHAR NOT NULL,
        platform VARCHAR NOT NULL,
        secret VARCHAR,
        syncedAt INTEGER,
        timestamp INTEGER NOT NULL
      );
    `)

    await account.execute(sql`
      INSERT OR IGNORE INTO key_value (key, value)
      VALUES ('connection_seq', 0);
    `)

    await setValue(accountName, `connections_schema_version`, SCHEMA_VERSION)
  }

  return account
}

export async function getConnections(
  accountName: string,
  query = "SELECT * FROM connections",
  params?: SqlParam[]
) {
  const account = await getAccountWithConnections(accountName)

  try {
    const result = await account.execute(query, params)

    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0] as string,
        connectionNumber: row[1] as number,
        address: row[2] as string,
        apiKey: row[3] as string,
        meta: JSON.parse(row[4] as string),
        options: JSON.parse(row[5] as string),
        extensionId: row[6] as string,
        platformId: row[7] as string,
        apiSecret: row[8] as string,
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
  const account = await getAccountWithConnections(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    throw new Error(`Failed to count connections: ${error}`)
  }
}

type PartialProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type NewConnection = PartialProps<
  Connection,
  "id" | "timestamp" | "syncedAt" | "connectionNumber"
>

function deriveConnectionId(record: NewConnection) {
  return hashString(`${record.extensionId}_${record.platformId}_${record.address || record.apiKey}`)
}

export async function upsertConnections(accountName: string, records: NewConnection[]) {
  const account = await getAccountWithConnections(accountName)

  try {
    const seq = await getValue(accountName, "connection_seq", 0)
    await account.executeMany(
      `INSERT OR REPLACE INTO connections (
        id, connectionNumber, address, key, meta, options, extensionId, platform, secret, syncedAt, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      records.map((record, index) => [
        record.id || deriveConnectionId(record),
        typeof record.connectionNumber === "number" ? record.connectionNumber : seq + index + 1,
        record.address ? getAddress(record.address) : null,
        record.apiKey || null,
        JSON.stringify(record.meta) || null,
        JSON.stringify(record.options) || null,
        record.extensionId,
        record.platformId,
        record.apiSecret || null,
        record.syncedAt || null,
        record.timestamp || Date.now(),
      ])
    )
    for (const record of records) {
      await setValue(accountName, `cursor_${record.id || deriveConnectionId(record)}`, 0)
    }
    const latestConnectionNumber = await account.execute(
      sql`SELECT MAX(connectionNumber) FROM connections`
    )
    await setValue(accountName, "connection_seq", latestConnectionNumber[0][0] as number)
    account.eventEmitter.emit(SubscriptionChannel.Connections, EventCause.Created)
  } catch (error) {
    throw new Error(`Failed to add or replace connections: ${error}`)
  }

  const results = await getConnections(
    accountName,
    "SELECT * FROM connections WHERE id IN (" + records.map(() => "?").join(",") + ")",
    records.map((record) => record.id || deriveConnectionId(record))
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
  const account = await getAccountWithConnections(accountName)
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

  await setValue(accountName, `cursor_${connection.id}`, 0)

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
  const account = await getAccountWithConnections(accountName)

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
    await setValue(accountName, `cursor_${connection.id}`, result.newCursor)
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
  const addressBook = JSON.parse(await getValue(accountName, "address_book", "{}"))
  const walletId = connection.address || connection.apiKey
  const platform = await getPlatform(connection.platformId)
  const extension = await getExtension(connection.extensionId)
  const walletLabel = addressBook[walletId] || walletId
  const platformLabel = platform?.name || connection.platformId
  const extensionLabel = extension?.extensionName || connection.extensionId

  return enqueueTask(accountName, {
    description: `Sync "${walletLabel}" from ${platformLabel} (${extensionLabel})`,
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
    name: `Sync connection #${connection.connectionNumber}`,
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
  const addressBook = JSON.parse(await getValue(accountName, "address_book", "{}"))
  const walletId = connection.address || connection.apiKey
  const platform = await getPlatform(connection.platformId)
  const extension = await getExtension(connection.extensionId)
  const walletLabel = addressBook[walletId] || walletId
  const platformLabel = platform?.name || connection.platformId
  const extensionLabel = extension?.extensionName || connection.extensionId

  return enqueueTask(accountName, {
    description: `Reset "${walletLabel}" from ${platformLabel} (${extensionLabel})`,
    determinate: true,
    function: async (progress) => {
      await resetConnection(accountName, connectionId, progress)
    },
    name: `Reset connection #${connection.connectionNumber}`,
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
  const addressBook = JSON.parse(await getValue(accountName, "address_book", "{}"))
  const walletId = connection.address || connection.apiKey
  const platform = await getPlatform(connection.platformId)
  const extension = await getExtension(connection.extensionId)
  const walletLabel = addressBook[walletId] || walletId
  const platformLabel = platform?.name || connection.platformId
  const extensionLabel = extension?.extensionName || connection.extensionId

  return enqueueTask(accountName, {
    description: `Remove "${walletLabel}" from ${platformLabel} (${extensionLabel}), alongside its audit logs and transactions.`,
    determinate: true,
    function: async (progress) => {
      await deleteConnection(accountName, connectionId, progress)
    },
    name: `Remove connection #${connection.connectionNumber}`,
    onCompletion,
    priority: TaskPriority.Highest,
    trigger,
  })
}
