import Big from "big.js"
import {
  AuditLog,
  AuditLogOperation,
  EventCause,
  MyAsset,
  ProgressCallback,
  SqlParam,
  SubscriptionChannel,
  Trade,
  TRADE_TYPES,
  TradeStatus,
  TradeType,
} from "src/interfaces"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"
import { hashString, isTestEnvironment, noop } from "src/utils/utils"

import { getAccount } from "../accounts-api"
import { getMyAssets } from "./assets-api"
import { getAuditLogs } from "./audit-logs-api"
import { getAssetPriceMap } from "./daily-prices-api"
import { getValue, setValue } from "./kv-api"
import { enqueueTask } from "./server-tasks-api"
import { getTransaction } from "./transactions-api"

const SCHEMA_VERSION = 11

async function getAccountWithTrades(accountName: string) {
  const schemaVersion = await getValue(accountName, `trade_schema_version`, 0)

  const account = await getAccount(accountName)

  if (schemaVersion < SCHEMA_VERSION) {
    await account.execute(sql`DROP TABLE IF EXISTS trade_audit_logs`)
    await account.execute(sql`DROP TABLE IF EXISTS trade_transactions`)
    await account.execute(sql`DROP TABLE IF EXISTS trade_tags`)
    await account.execute(sql`DROP TABLE IF EXISTS trades`)

    await account.execute(sql`
      CREATE TABLE trades (
        id VARCHAR PRIMARY KEY,
        tradeNumber INTEGER NOT NULL,
        assetId VARCHAR NOT NULL,
        amount FLOAT NOT NULL,
        balance FLOAT NOT NULL,
        createdAt INTEGER NOT NULL,
        closedAt INTEGER,
        duration INTEGER,
        tradeStatus VARCHAR NOT NULL,
        tradeType VARCHAR NOT NULL,
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

    await setValue(`trade_schema_version`, SCHEMA_VERSION, accountName)
  }

  return account
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
  const account = await getAccountWithTrades(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        tradeNumber: row[1],
        assetId: row[2],
        amount: row[3],
        balance: row[4],
        createdAt: row[5],
        closedAt: row[6],
        duration: row[7],
        tradeStatus: row[8] as TradeStatus,
        tradeType: row[9] as TradeType,
        cost: JSON.parse(String(row[10] || "[]")),
        fees: JSON.parse(String(row[11] || "[]")),
        profit: JSON.parse(String(row[12] || "[]")),
        txIds: row[13] ? String(row[13]).split(",") : undefined,
        auditLogIds: row[14] ? String(row[14]).split(",") : undefined,
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
  const account = await getAccountWithTrades(accountName)

  try {
    await account.executeMany(
      `INSERT OR REPLACE INTO trades (
        id, tradeNumber, assetId, amount, balance, createdAt, closedAt, duration, tradeStatus, tradeType, cost, fees, profit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      trades.map((trade) => [
        trade.id,
        trade.tradeNumber,
        trade.assetId,
        trade.amount,
        trade.balance,
        trade.createdAt,
        trade.closedAt || null,
        trade.duration || null,
        trade.tradeStatus,
        trade.tradeType,
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
  const account = await getAccountWithTrades(accountName)
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
  const account = await getAccountWithTrades(accountName)

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

function derivadeTradeId(assetId: string, createdAt: number) {
  return `${hashString(`${assetId}_${createdAt}`)}`
}

export async function computeTrades(
  accountName: string,
  progress: ProgressCallback = noop
): Promise<void> {
  const account = await getAccountWithTrades(accountName)

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

  const myAssets = await getMyAssets(accountName)
  const assetsMap: Record<string, MyAsset> = myAssets.reduce((acc, asset) => {
    acc[asset.id] = asset
    return acc
  }, {})

  const assetGroups: Record<string, AuditLog[]> = {}

  auditLogs.forEach((log) => {
    const key = log.assetId
    if (!isTestEnvironment && (!assetsMap[key] || !assetsMap[key].coingeckoId)) {
      console.log(`Skipped ${key}: No coingeckoId`)
      return
    }
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

  async function processTransactionForTrade(
    trade: Trade,
    txId: string,
    assetId: string,
    operation: AuditLogOperation
  ): Promise<void> {
    const tx = await getTransaction(accountName, txId)
    const priceMap = await getAssetPriceMap(accountName, tx.timestamp)

    if (!tx) {
      throw new Error(`Transaction with id ${txId} not found`)
    }

    if (tx.outgoingAsset && tx.outgoing) {
      // Add outgoing as cost if it's a different asset OR if it's the same asset in a deposit
      if (tx.outgoingAsset !== assetId || operation === "Deposit") {
        const assetPrice = priceMap[tx.outgoingAsset].value
        if (!assetPrice) throw new Error(`Price not found for asset ${tx.outgoingAsset}`)
        trade.cost.push([
          tx.outgoingAsset,
          `-${tx.outgoing}`,
          Big(assetPrice).mul(`-${tx.outgoing}`).toString(),
        ])
      }
    }

    if (tx.incomingAsset && tx.incoming) {
      // Add incoming as profit if it's a different asset OR if it's the same asset in a withdraw
      if (tx.incomingAsset !== assetId || operation === "Withdraw") {
        const assetPrice = priceMap[tx.incomingAsset].value
        if (!assetPrice) throw new Error(`Price not found for asset ${tx.incomingAsset}`)
        trade.profit.push([
          tx.incomingAsset,
          tx.incoming,
          Big(assetPrice).mul(tx.incoming).toString(),
        ])
      }
    }

    if (tx.feeAsset && tx.fee) {
      const assetPrice = priceMap[tx.feeAsset].value
      if (!assetPrice) throw new Error(`Price not found for asset ${tx.feeAsset}`)
      trade.fees.push([tx.feeAsset, tx.fee, Big(assetPrice).mul(tx.fee).toString()])
    }

    tradeTransactions.push([trade.id, tx.id])
  }

  for (const [assetId, logs] of Object.entries(assetGroups)) {
    let currentTrade: Trade | null = null
    let balance = new Big(0)

    for (const log of logs) {
      const change = new Big(log.change)
      balance = balance.plus(change)

      // If balance is becoming non-zero from zero, start a new trade
      if (!balance.eq(0) && currentTrade === null) {
        const tradeId = derivadeTradeId(assetId, log.timestamp)
        const tradeType = balance.gt(0) ? TRADE_TYPES[0] : TRADE_TYPES[1] // "Long" or "Short"

        currentTrade = {
          amount: balance.abs().toNumber(),
          assetId,
          balance: balance.toNumber(),
          cost: [],
          createdAt: log.timestamp,
          fees: [],
          id: tradeId,
          profit: [],
          tradeNumber: 0,
          tradeStatus: "open",
          tradeType,
        }

        tradeAuditLogs.push([tradeId, log.id])
        if (log.txId) {
          tradeTransactions.push([tradeId, log.txId])
          // Track transactions for cost/profit/fees
          await processTransactionForTrade(currentTrade, log.txId, assetId, log.operation)
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
          // Update cost, profit and fees if this is a transaction
          await processTransactionForTrade(currentTrade, log.txId, assetId, log.operation)
        }

        // Check if we need to close the current trade and start a new one
        if (
          (currentTrade.tradeType === TRADE_TYPES[0] && balance.lt(0)) || // Long position going negative
          (currentTrade.tradeType === TRADE_TYPES[1] && balance.gt(0)) || // Short position going positive
          balance.eq(0) // Position fully closed
        ) {
          // Close current trade
          currentTrade.tradeStatus = "closed"
          currentTrade.closedAt = log.timestamp
          currentTrade.duration = log.timestamp - currentTrade.createdAt
          trades.push(currentTrade)

          // If balance is non-zero, start a new trade in the opposite direction
          if (!balance.eq(0)) {
            const newTradeId = derivadeTradeId(assetId, log.timestamp)
            const newTradeType = balance.gt(0) ? TRADE_TYPES[0] : TRADE_TYPES[1] // "Long" or "Short"

            currentTrade = {
              amount: balance.abs().toNumber(),
              assetId,
              balance: balance.toNumber(),
              cost: [],
              createdAt: log.timestamp,
              fees: [],
              id: newTradeId,
              profit: [],
              tradeNumber: 0,
              tradeStatus: "open",
              tradeType: newTradeType,
            }

            tradeAuditLogs.push([newTradeId, log.id])
            if (log.txId) tradeTransactions.push([newTradeId, log.txId])
          } else {
            currentTrade = null
          }
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
    trades.sort((a, b) => a.createdAt - b.createdAt)
    trades.forEach((trade, index) => {
      trade.tradeNumber = index + 1
    })

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
  const account = await getAccountWithTrades(accountName)
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
  const account = await getAccountWithTrades(accountName)
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
