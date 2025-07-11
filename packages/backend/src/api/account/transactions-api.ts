import Big from "big.js"
import { mergeTransactions } from "src/extensions/utils/etherscan-utils"
import {
  AuditLog,
  AuditLogOperation,
  EventCause,
  MyAsset,
  ServerFile,
  SqlParam,
  SubscriptionChannel,
  TaskCompletionCallback,
} from "src/interfaces"
import { isEvmPlatform } from "src/utils/assets-utils"
import { transformTransactionsToCsv } from "src/utils/csv-export-utils"
import { createCsvString } from "src/utils/csv-utils"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { saveFile } from "src/utils/file-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"
import { noop, writesAllowed } from "src/utils/utils"

import {
  EtherscanTransaction,
  ProgressCallback,
  TaskPriority,
  TaskTrigger,
  Transaction,
} from "../../interfaces"
import { getAccount } from "../accounts-api"
import { getMyAssets } from "./assets-api"
import { getAuditLogsByTxId, upsertAuditLogs } from "./audit-logs-api"
import { getValue, setValue } from "./kv-api"
import { enqueueTask } from "./server-tasks-api"
import { assignTagToAuditLog, assignTagToTransaction } from "./tags-api"

const SCHEMA_VERSION = 1

export async function getAccountWithTransactions(accountName: string) {
  const account = await getAccount(accountName)
  if (!writesAllowed) return account

  const schemaVersion = await getValue(accountName, `transactions_schema_version`, 0)

  if (schemaVersion < SCHEMA_VERSION) {
    // Drop existing table to recreate with new schema
    await account.execute(sql`DROP TABLE IF EXISTS transactions`)

    await account.execute(sql`
      CREATE TABLE transactions (
        id VARCHAR PRIMARY KEY,
        incomingAsset VARCHAR,
        incoming VARCHAR,
        incomingN FLOAT GENERATED ALWAYS AS (CAST(incoming AS REAL)) STORED,
        feeAsset VARCHAR,
        fee VARCHAR,
        feeN FLOAT GENERATED ALWAYS AS (CAST(fee AS REAL)) STORED,
        fileImportId VARCHAR,
        connectionId VARCHAR,
        importIndex INTEGER,
        outgoingAsset VARCHAR,
        outgoing VARCHAR,
        outgoingN FLOAT GENERATED ALWAYS AS (CAST(outgoing AS REAL)) STORED,
        notes VARCHAR,
        platformId VARCHAR NOT NULL,
        price VARCHAR,
        priceN FLOAT GENERATED ALWAYS AS (CAST(price AS REAL)) STORED,
        role VARCHAR,
        timestamp INTEGER NOT NULL,
        type VARCHAR NOT NULL,
        wallet VARCHAR NOT NULL,
        metadata JSON,
        FOREIGN KEY (feeAsset) REFERENCES assets(id),
        FOREIGN KEY (incomingAsset) REFERENCES assets(id),
        FOREIGN KEY (outgoingAsset) REFERENCES assets(id),
        FOREIGN KEY (connectionId) REFERENCES connections(id),
        FOREIGN KEY (fileImportId) REFERENCES fileImports(id)
      );
    `)

    await setValue(accountName, `transactions_schema_version`, SCHEMA_VERSION)
  }

  return account
}

export async function getTransactions(
  accountName: string,
  query = "SELECT * FROM transactions ORDER BY timestamp DESC, incomingN DESC",
  params?: SqlParam[]
) {
  const account = await getAccountWithTransactions(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        incomingAsset: row[1],
        incoming: row[2],
        feeAsset: row[4],
        fee: row[5],
        fileImportId: row[7],
        connectionId: row[8],
        importIndex: row[9],
        outgoingAsset: row[10],
        outgoing: row[11],
        notes: row[13],
        platformId: row[14],
        price: row[15],
        role: row[17],
        timestamp: row[18],
        type: row[19],
        wallet: row[20],
        metadata: JSON.parse(row[21] as string),
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as Transaction
    })
  } catch (error) {
    throw new Error(`Failed to query transactions: ${error}`)
  }
}

export async function getTransaction(accountName: string, id: string) {
  const records = await getTransactions(accountName, "SELECT * FROM transactions WHERE id = ?", [
    id,
  ])
  return records[0]
}

export async function upsertTransactions(accountName: string, records: Transaction[]) {
  const account = await getAccountWithTransactions(accountName)

  try {
    await account.executeMany(
      `INSERT OR REPLACE INTO transactions (
        id, incomingAsset, fee, feeAsset, fileImportId, connectionId, 
        importIndex, incoming, outgoing, outgoingAsset, notes, platformId, price, 
        role, timestamp, type, wallet, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      records.map((record) => [
        record.id,
        record.incomingAsset || null,
        record.fee || null,
        record.feeAsset || null,
        record.fileImportId || null,
        record.connectionId || null,
        record.importIndex || null,
        record.incoming || null,
        record.outgoing || null,
        record.outgoingAsset || null,
        record.notes || null,
        record.platformId,
        record.price || null,
        record.role || null,
        record.timestamp,
        record.type,
        record.wallet,
        JSON.stringify(record.metadata || {}),
      ])
    )
    account.eventEmitter.emit(SubscriptionChannel.Transactions, EventCause.Created)
  } catch (error) {
    throw new Error(`Failed to add or replace transaction: ${error}`)
  }
}

export async function upsertTransaction(accountName: string, record: Transaction) {
  return upsertTransactions(accountName, [record])
}

export async function patchTransaction(
  accountName: string,
  id: string,
  patch: Partial<Transaction>
) {
  const existing = await getTransaction(accountName, id)
  const newValue = { ...existing, ...patch }
  await upsertTransaction(accountName, newValue)
}

export async function countTransactions(
  accountName: string,
  query = "SELECT COUNT(*) FROM transactions",
  params?: SqlParam[]
): Promise<number> {
  const account = await getAccountWithTransactions(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    throw new Error(`Failed to count transactions: ${error}`)
  }
}

export async function subscribeToTransactions(
  accountName: string,
  callback: (cause: EventCause) => void
) {
  return createSubscription(accountName, SubscriptionChannel.Transactions, callback)
}

/**
 * This only applies to Etherscan transactions
 */
export async function autoMergeTransactions(
  accountName: string,
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  const account = await getAccountWithTransactions(accountName)
  await progress([0, "Fetching all transactions"])
  const transactions = await getTransactions(accountName)

  const etherscan = transactions.filter((tx) =>
    isEvmPlatform(tx.platformId)
  ) as EtherscanTransaction[]

  if (signal?.aborted) throw new Error(signal.reason)
  await progress([25, `Processing ${etherscan.length} (EVM) transactions`])
  const { merged, deduplicateMap } = mergeTransactions(etherscan)

  if (signal?.aborted) throw new Error(signal.reason)

  await progress([50, `Saving ${merged.length} merged transactions`])

  await upsertTransactions(accountName, merged)

  await progress([70, `Updating the audit logs of ${merged.length} merged transactions`])

  for (const tx of merged) {
    const deduplicated = deduplicateMap[tx.id]

    for (const deduplicatedTx of deduplicated) {
      const auditLogs = await getAuditLogsByTxId(accountName, deduplicatedTx.id)

      for (const auditLog of auditLogs) {
        auditLog.txId = tx.id
      }

      await account.executeMany(
        `
        UPDATE audit_logs
        SET txId = ?
        WHERE id = ?
        `,
        auditLogs.map((log) => [log.txId || null, log.id])
      )

      if (tx.type === "Swap") {
        await account.executeMany(
          `
          UPDATE audit_logs
          SET operation = ?
          WHERE id = ?
        `,
          auditLogs.map((log) => [
            log.operation === "Deposit"
              ? ("Buy" satisfies AuditLogOperation)
              : log.operation === "Withdraw"
                ? ("Sell" satisfies AuditLogOperation)
                : log.operation,
            log.id,
          ])
        )
      }

      if (tx.type === "Wrap") {
        await account.executeMany(
          `
          UPDATE audit_logs
          SET operation = ?
          WHERE id = ?
        `,
          auditLogs.map((log) => [
            log.operation === "Deposit"
              ? ("Mint" satisfies AuditLogOperation)
              : log.operation === "Withdraw"
                ? ("Wrap" satisfies AuditLogOperation)
                : log.operation,
            log.id,
          ])
        )
      }
    }
  }

  const deduplicated = Object.values(deduplicateMap).flat()
  await progress([90, `Deleting ${deduplicated.length} deduplicated transactions`])
  const deleteQuery = `
    DELETE FROM transactions
    WHERE id = ?
  `
  const deleteParams = deduplicated.map((tx) => [tx.id])
  await account.executeMany(deleteQuery, deleteParams)

  await progress([100, "Done"])
}

export function enqueueAutoMerge(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Auto-merging transactions.",
    determinate: true,
    function: async (progress, signal) => {
      await autoMergeTransactions(accountName, progress, signal)
    },
    name: "Auto-merge transactions",
    priority: TaskPriority.MediumHigh,
    trigger,
  })
}

export async function detectSpamTransactions(
  accountName: string,
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  const account = await getAccountWithTransactions(accountName)
  await progress([0, "Fetching all transactions"])
  const transactions = await getTransactions(accountName)

  const etherscanTransactions = transactions.filter((tx) =>
    isEvmPlatform(tx.platformId)
  ) as EtherscanTransaction[]
  if (signal?.aborted) {
    throw new Error(signal.reason)
  }

  await progress([33, `Processing ${etherscanTransactions.length} (EVM) transactions`])
  const assets = await getMyAssets(accountName)
  const assetMap = assets.reduce(
    (acc, asset) => {
      acc[asset.id] = asset
      return acc
    },
    {} as Record<string, MyAsset>
  )

  const spam = etherscanTransactions.filter((tx) => {
    // it means the user created the transaction
    if (tx.fee) return false
    if (tx.id.startsWith("MANUAL_")) return false
    if (tx.incomingAsset && !assetMap[tx.incomingAsset]?.coingeckoId) {
      return true
    }
    if (tx.outgoingAsset && !assetMap[tx.outgoingAsset]?.coingeckoId) {
      return true
    }
    return false
  })

  if (signal?.aborted) {
    throw new Error(signal.reason)
  }

  await progress([66, `Tagging ${spam.length} spam transactions`])

  let auditLogsCount = 0

  for (const tx of spam) {
    await assignTagToTransaction(accountName, tx.id, "spam")
    const auditLogs = await getAuditLogsByTxId(accountName, tx.id)
    auditLogsCount += auditLogs.length
    for (const log of auditLogs) {
      await assignTagToAuditLog(accountName, log.id, "spam")
    }
  }

  await progress([90, `Tagged ${auditLogsCount} audit logs`])

  account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Updated)
  account.eventEmitter.emit(SubscriptionChannel.Transactions, EventCause.Updated)

  await progress([100, "Done"])
}

export function enqueueDetectSpamTransactions(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Detect spam transactions.",
    determinate: true,
    function: async (progress, signal) => {
      await detectSpamTransactions(accountName, progress, signal)
    },
    name: "Detect spam transactions",
    priority: TaskPriority.Medium,
    trigger,
  })
}

export async function addTransaction(
  transaction: Omit<Transaction, "id" | "_rev" | "importId" | "importIndex">,
  accountName: string
) {
  const {
    fee,
    feeAsset,
    incoming,
    incomingAsset,
    outgoing,
    outgoingAsset,
    platformId,
    timestamp,
    type,
    wallet,
    notes,
  } = transaction

  // validation
  if (incoming && !incomingAsset) {
    throw new Error("Incoming asset is required")
  }
  if (outgoing && !outgoingAsset) {
    throw new Error("Outgoing asset is required")
  }
  if (fee && !feeAsset) {
    throw new Error("Fee asset is required")
  }
  if (timestamp < 0) {
    throw new Error("Timestamp is required")
  }

  const seq = await getValue(accountName, "transaction_man_seq", 1)
  const id = `MANUAL_${seq}`
  // const importId = ""
  const importIndex = 0
  const operation = type
    .replace("Wrap", "Unknown")
    .replace("Unwrap", "Unknown") as AuditLogOperation
  const logs: AuditLog[] = []
  let price: string | undefined
  if (incoming && outgoing) {
    price = Big(outgoing).div(Big(incoming)).toString()
  }
  if (incoming && incomingAsset) {
    logs.push({
      assetId: incomingAsset,
      change: incoming,
      id: `${id}_BUY`,
      importIndex,
      operation: type === "Swap" ? "Buy" : operation,
      platformId,
      timestamp,
      txId: id,
      wallet,
    })
  }
  if (outgoing && outgoingAsset) {
    logs.push({
      assetId: outgoingAsset,
      change: `-${outgoing}`,
      id: `${id}_SELL`,
      importIndex,
      operation: type === "Swap" ? "Sell" : operation,
      platformId,
      timestamp,
      txId: id,
      wallet,
    })
  }
  if (fee) {
    logs.push({
      assetId: feeAsset,
      change: `-${fee}`,
      id: `${id}_FEE`,
      importIndex,
      operation: "Fee",
      platformId,
      timestamp,
      txId: id,
      wallet,
    })
  }
  const tx: Transaction[] = [
    {
      fee: !fee ? undefined : fee,
      feeAsset: !fee ? undefined : feeAsset,
      id,
      importIndex,
      incoming: !incoming ? undefined : incoming,
      incomingAsset: !incoming ? undefined : incomingAsset,
      metadata: {},
      notes,
      outgoing: !outgoing ? undefined : outgoing,
      outgoingAsset: !outgoing ? undefined : outgoingAsset,
      platformId,
      price,
      timestamp,
      type,
      wallet,
    },
  ]
  await upsertTransactions(accountName, tx)
  await upsertAuditLogs(accountName, logs)
  await setValue(accountName, "transaction_man_seq", seq + 1)
}

export async function getTransactionsByTxHash(accountName: string, txHash: string) {
  return getTransactions(
    accountName,
    "SELECT * FROM transactions WHERE json_extract(metadata, '$.txHash') = ?",
    [txHash]
  )
}

export async function deleteTransaction(
  accountName: string,
  transactionId: string,
  progress: ProgressCallback = noop
): Promise<void> {
  const account = await getAccountWithTransactions(accountName)

  await progress([0, `Removing transaction ${transactionId}`])

  const auditLogs = await getAuditLogsByTxId(accountName, transactionId)
  await progress([25, `Removing ${auditLogs.length} associated audit logs`])

  await account.execute(`DELETE FROM audit_logs WHERE txId = ?`, [transactionId])

  await account.execute(`DELETE FROM transaction_tags WHERE transaction_id = ?`, [transactionId])

  await progress([75, `Removing transaction`])
  await account.execute(`DELETE FROM transactions WHERE id = ?`, [transactionId])

  await progress([100, `Transaction removed successfully`])

  account.eventEmitter.emit(SubscriptionChannel.Transactions, EventCause.Deleted, transactionId)
  let oldestTimestamp = Date.now()
  for (const log of auditLogs) {
    if (log.timestamp < oldestTimestamp) oldestTimestamp = log.timestamp
  }
  account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Deleted, oldestTimestamp)
}

export async function enqueueDeleteTransaction(
  accountName: string,
  trigger: TaskTrigger,
  transactionId: string,
  onCompletion?: TaskCompletionCallback
) {
  return enqueueTask(accountName, {
    description: `Remove transaction ${transactionId} and its audit logs.`,
    determinate: true,
    function: async (progress) => {
      await deleteTransaction(accountName, transactionId, progress)
    },
    name: `Remove transaction ${transactionId}`,
    onCompletion,
    priority: TaskPriority.Highest,
    trigger,
  })
}

export async function enqueueExportTransactions(accountName: string, trigger: TaskTrigger) {
  return new Promise<ServerFile>((resolve, reject) => {
    enqueueTask(accountName, {
      //   abortable: true, TODO5
      description: "Export all transactions.",
      determinate: true,
      function: async (progress) => {
        try {
          await progress([0, "Fetching all transactions"])
          const txns = await getTransactions(accountName)
          await progress([25, `Transforming ${txns.length} transactions to CSV`])
          const data = transformTransactionsToCsv(txns)
          await progress([50, `Saving ${txns.length} transactions to CSV`])
          const fileRecord = await saveFile(
            accountName,
            Buffer.from(createCsvString(data)),
            `${accountName}-transactions.csv`,
            "text/csv;charset=utf-8;"
          )
          await progress([75, `Transactions exported to CSV`])
          resolve(fileRecord)
        } catch (error) {
          reject(error)
          throw error
        }
      },
      name: "Export all transactions",
      priority: TaskPriority.Low,
      trigger,
    })
  })
}
