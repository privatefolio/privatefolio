import Big from "big.js"
import {
  AuditLog,
  EventCause,
  ProgressCallback,
  SqlParam,
  SubscriptionChannel,
  Trade,
} from "src/interfaces"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"
import { hashString, noop } from "src/utils/utils"

import { Account, getAccount } from "../accounts-api"
import { getAuditLogs } from "./audit-logs-api"
import { getValue, setValue } from "./kv-api"
import { enqueueTask } from "./server-tasks-api"
import { getTransactionsByTxHash } from "./transactions-api"

const TRADES_SCHEMA_VERSION = 1

async function initializeTradesSchema(account: Account): Promise<void> {
  const currentVersion = await getValue(account.name, "trades_schema_version", "0")

  if (Number(currentVersion) !== TRADES_SCHEMA_VERSION) {
    // Drop existing tables if they exist
    await account.execute("DROP TABLE IF EXISTS trade_tags")
    await account.execute("DROP TABLE IF EXISTS trade_transactions")
    await account.execute("DROP TABLE IF EXISTS trade_audit_logs")
    await account.execute("DROP TABLE IF EXISTS trades")

    // Create tables with new schema
    await account.execute(sql`
CREATE TABLE trades (
  id VARCHAR PRIMARY KEY,
  assetId VARCHAR NOT NULL,
  amount FLOAT NOT NULL,
  balance FLOAT NOT NULL,
  createdAt INTEGER NOT NULL,
  closedAt INTEGER,
  duration INTEGER,
  isOpen BOOLEAN NOT NULL DEFAULT 1,
  cost JSON,
  fees JSON,
  profit JSON,
  FOREIGN KEY (assetId) REFERENCES assets(id)
);
`)

    await account.execute(sql`
CREATE TABLE trade_audit_logs (
  trade_id VARCHAR NOT NULL,
  audit_log_id VARCHAR NOT NULL,
  PRIMARY KEY (trade_id, audit_log_id),
  FOREIGN KEY (trade_id) REFERENCES trades(id),
  FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id)
);
`)

    await account.execute(sql`
CREATE TABLE trade_transactions (
  trade_id VARCHAR NOT NULL,
  transaction_id VARCHAR NOT NULL,
  PRIMARY KEY (trade_id, transaction_id),
  FOREIGN KEY (trade_id) REFERENCES trades(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
`)

    await account.execute(sql`
CREATE TABLE trade_tags (
  trade_id VARCHAR NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (trade_id, tag_id),
  FOREIGN KEY (trade_id) REFERENCES trades(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
`)

    // Update schema version
    await setValue("trades_schema_version", TRADES_SCHEMA_VERSION.toString(), account.name)
  }
}

export const getTradesFullQuery = async () => sql`
SELECT
  trades.*,
  GROUP_CONCAT(DISTINCT trade_transactions.transaction_id) as txIds,
  GROUP_CONCAT(DISTINCT trade_audit_logs.audit_log_id) as auditLogIds
FROM trades
LEFT JOIN trade_transactions ON trades.id = trade_transactions.trade_id
LEFT JOIN trade_audit_logs ON trades.id = trade_audit_logs.trade_id
GROUP BY trades.id
ORDER BY trades.createdAt ASC
`

export async function getTrades(
  accountName: string,
  query = "SELECT * FROM trades ORDER BY createdAt DESC",
  params?: SqlParam[]
): Promise<Trade[]> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        assetId: row[1],
        amount: row[2],
        balance: row[3],
        createdAt: row[4],
        closedAt: row[5],
        duration: row[6],
        isOpen: Boolean(row[7]),
        cost: JSON.parse(String(row[8] || "[]")),
        fees: JSON.parse(String(row[9] || "[]")),
        profit: JSON.parse(String(row[10] || "[]")),
        txIds: row[11] ? String(row[11]).split(",") : undefined,
        auditLogIds: row[12] ? String(row[12]).split(",") : undefined,
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as Trade
    })
  } catch (error) {
    throw new Error(`Failed to query trades: ${error}`)
  }
}

export async function getTrade(accountName: string, id: string): Promise<Trade | undefined> {
  const trades = await getTrades(accountName, "SELECT * FROM trades WHERE id = ?", [id])
  return trades[0]
}

export async function upsertTrades(accountName: string, trades: Trade[]): Promise<void> {
  const account = await getAccount(accountName)

  try {
    await account.executeMany(
      `INSERT OR REPLACE INTO trades (
        id, assetId, amount, balance, createdAt, closedAt, duration, isOpen, 
        cost, fees, profit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      trades.map((trade) => [
        trade.id,
        trade.assetId,
        trade.amount,
        trade.balance,
        trade.createdAt,
        trade.closedAt || null,
        trade.duration || null,
        trade.isOpen ? 1 : 0,
        JSON.stringify(trade.cost || []),
        JSON.stringify(trade.fees || []),
        JSON.stringify(trade.profit || []),
      ])
    )

    account.eventEmitter.emit(SubscriptionChannel.Trades, EventCause.Created)
  } catch (error) {
    throw new Error(`Failed to add or replace trades: ${error}`)
  }
}

export async function upsertTrade(accountName: string, trade: Trade): Promise<void> {
  return upsertTrades(accountName, [trade])
}

export async function patchTrade(
  accountName: string,
  id: string,
  patch: Partial<Trade>
): Promise<void> {
  const existing = await getTrade(accountName, id)
  if (!existing) {
    throw new Error(`Trade with id ${id} not found`)
  }
  const newValue = { ...existing, ...patch }
  await upsertTrade(accountName, newValue)
}

export async function deleteTrade(accountName: string, id: string): Promise<void> {
  const account = await getAccount(accountName)
  // First delete the relationships
  await account.execute("DELETE FROM trade_tags WHERE trade_id = ?", [id])
  await account.execute("DELETE FROM trade_audit_logs WHERE trade_id = ?", [id])
  await account.execute("DELETE FROM trade_transactions WHERE trade_id = ?", [id])
  // Then delete the trade
  await account.execute("DELETE FROM trades WHERE id = ?", [id])
  account.eventEmitter.emit(SubscriptionChannel.Trades, EventCause.Deleted)
}

export async function countTrades(
  accountName: string,
  query = "SELECT COUNT(*) FROM trades",
  params?: SqlParam[]
): Promise<number> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    throw new Error(`Failed to count trades: ${error}`)
  }
}

export async function subscribeToTrades(
  accountName: string,
  callback: (cause: EventCause) => void
) {
  return createSubscription(accountName, SubscriptionChannel.Trades, callback)
}

export async function computeTrades(
  accountName: string,
  progress: ProgressCallback = noop
): Promise<void> {
  const account = await getAccount(accountName)

  // Initialize schema if needed
  await initializeTradesSchema(account)

  await account.execute("DELETE FROM trade_audit_logs")
  await account.execute("DELETE FROM trade_transactions")
  await account.execute("DELETE FROM trades")

  await progress([0, "Fetching audit logs"])
  const auditLogs = await getAuditLogs(
    accountName,
    "SELECT * FROM audit_logs ORDER BY timestamp ASC, changeN ASC, id ASC"
  )

  if (auditLogs.length === 0) {
    await progress([100, "No audit logs found"])
    return
  }

  await progress([10, `Processing ${auditLogs.length} audit logs`])

  const assetGroups: Record<string, AuditLog[]> = {}

  auditLogs.forEach((log) => {
    const key = `${log.assetId}`
    if (!assetGroups[key]) {
      assetGroups[key] = []
    }
    assetGroups[key].push(log)
  })

  await progress([20, `Found ${Object.keys(assetGroups).length} asset groups`])

  const trades: Trade[] = []
  let processedGroups = 0

  const tradeAuditLogs: [string, string][] = []
  const tradeTransactions: [string, string][] = []

  for (const [assetId, logs] of Object.entries(assetGroups)) {
    let currentTrade: Trade | null = null
    let balance = new Big(0)

    for (const log of logs) {
      const change = new Big(log.change)

      balance = balance.plus(change)

      // If balance is becoming non-zero from zero, start a new trade
      if (balance.gt(0) && currentTrade === null) {
        const tradeId = `trade_${hashString(`${assetId}_${log.timestamp}`)}`

        currentTrade = {
          amount: balance.toNumber(),
          assetId,
          balance: balance.toNumber(),
          cost: [],
          createdAt: log.timestamp,
          fees: [],
          id: tradeId,
          isOpen: true,
          profit: [],
        }

        tradeAuditLogs.push([tradeId, log.id])
        if (log.txId) tradeTransactions.push([tradeId, log.txId])

        // If this is a buy/deposit operation, track what was sold
        if (change.gt(0) && log.txId) {
          const transactions = await getTransactionsByTxHash(accountName, log.txId)

          for (const tx of transactions) {
            if (tx.outgoingAsset && tx.outgoingAsset !== assetId) {
              currentTrade.cost.push([tx.outgoingAsset, tx.outgoing])
            }

            if (tx.incomingAsset && tx.incomingAsset !== assetId) {
              currentTrade.profit.push([tx.incomingAsset, tx.incoming])
            }

            if (tx.feeAsset && tx.fee) {
              currentTrade.fees.push([tx.feeAsset, tx.fee])
            }

            tradeTransactions.push([currentTrade.id, tx.id])
          }
        }
      }
      // If we have an active trade, update it
      else if (currentTrade) {
        // Update balance using Big.js and log.change
        currentTrade.balance = balance.toNumber()

        // Update amount (maximum absolute balance during the trade)
        const currentAmount = new Big(currentTrade.amount)
        const absBalance = balance.abs()
        currentTrade.amount = absBalance.gt(currentAmount)
          ? absBalance.toNumber()
          : currentAmount.toNumber()

        // Add to the relationship mapping for bulk insert
        tradeAuditLogs.push([currentTrade.id, log.id])

        // Add the transaction relationship if txId exists
        if (log.txId) {
          tradeTransactions.push([currentTrade.id, log.txId])

          // Update cost and fees if this is a transaction
          const transactions = await getTransactionsByTxHash(accountName, log.txId)

          for (const tx of transactions) {
            if (tx.outgoingAsset && tx.outgoingAsset !== assetId) {
              currentTrade.cost.push([tx.outgoingAsset, tx.outgoing])
            }

            if (tx.incomingAsset && tx.incomingAsset !== assetId) {
              currentTrade.profit.push([tx.incomingAsset, tx.incoming])
            }

            if (tx.feeAsset && tx.fee) {
              currentTrade.fees.push([tx.feeAsset, tx.fee])
            }

            // Add transaction relationship
            tradeTransactions.push([currentTrade.id, tx.id])
          }
        }

        // If balance reaches zero or becomes negative, close the trade
        if (balance.lte(0)) {
          currentTrade.isOpen = false
          currentTrade.closedAt = log.timestamp
          currentTrade.duration = log.timestamp - currentTrade.createdAt

          trades.push(currentTrade)
          currentTrade = null
        }
      }
    }

    // If there's an active trade at the end, it's still open
    if (currentTrade) {
      trades.push(currentTrade)
    }

    processedGroups++
    await progress([
      20 + Math.floor((processedGroups / Object.keys(assetGroups).length) * 70),
      `Processed ${processedGroups}/${Object.keys(assetGroups).length} asset groups`,
    ])
  }

  // Save trades
  if (trades.length > 0) {
    await upsertTrades(accountName, trades)

    // Insert all trade-audit log relationships
    if (tradeAuditLogs.length > 0) {
      await account.executeMany(
        "INSERT OR IGNORE INTO trade_audit_logs (trade_id, audit_log_id) VALUES (?, ?)",
        tradeAuditLogs
      )
    }

    // Insert all trade-transaction relationships
    if (tradeTransactions.length > 0) {
      await account.executeMany(
        "INSERT OR IGNORE INTO trade_transactions (trade_id, transaction_id) VALUES (?, ?)",
        tradeTransactions
      )
    }
  }

  await progress([100, "Trades computation completed"])
}

export function enqueueComputeTrades(accountName: string) {
  return enqueueTask(accountName, {
    description: "Computing trades from audit logs.",
    determinate: true,
    function: async (progress) => {
      await computeTrades(accountName, progress)
    },
    name: "Compute trades",
    priority: 3, // Medium priority
    trigger: "user",
  })
}

export async function getTradeAuditLogs(accountName: string, tradeId: string): Promise<string[]> {
  const account = await getAccount(accountName)
  try {
    const result = await account.execute(
      "SELECT audit_log_id FROM trade_audit_logs WHERE trade_id = ?",
      [tradeId]
    )
    return result.map((row) => row[0] as string)
  } catch (error) {
    throw new Error(`Failed to get audit logs for trade: ${error}`)
  }
}

export async function getTradeTransactions(
  accountName: string,
  tradeId: string
): Promise<string[]> {
  const account = await getAccount(accountName)
  try {
    const result = await account.execute(
      "SELECT transaction_id FROM trade_transactions WHERE trade_id = ?",
      [tradeId]
    )
    return result.map((row) => row[0] as string)
  } catch (error) {
    throw new Error(`Failed to get transactions for trade: ${error}`)
  }
}
