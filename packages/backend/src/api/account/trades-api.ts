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
import { hashString, noop } from "src/utils/utils"

import { getAccount } from "../accounts-api"
import { getAuditLogs } from "./audit-logs-api"
import { enqueueTask } from "./server-tasks-api"
import { getTransactionsByTxHash } from "./transactions-api"

export const getTradesFullQuery = async () => sql`
SELECT
  trades.*,
  GROUP_CONCAT(trade_transactions.transaction_id) as txIds,
  GROUP_CONCAT(trade_audit_logs.audit_log_id) as auditLogIds
FROM trades
LEFT JOIN trade_transactions ON trades.id = trade_transactions.trade_id
LEFT JOIN trade_audit_logs ON trades.id = trade_audit_logs.trade_id
GROUP BY trades.id
ORDER BY trades.createdAt DESC
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
        soldAssets: JSON.parse(String(row[8] || "[]")),
        soldAmounts: JSON.parse(String(row[9] || "[]")),
        feeAssets: JSON.parse(String(row[10] || "[]")),
        feeAmounts: JSON.parse(String(row[11] || "[]")),
        txIds: row[12] ? String(row[12]).split(",") : undefined,
        auditLogIds: row[13] ? String(row[13]).split(",") : undefined,
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
        soldAssets, soldAmounts, feeAssets, feeAmounts
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      trades.map((trade) => [
        trade.id,
        trade.assetId,
        trade.amount,
        trade.balance,
        trade.createdAt,
        trade.closedAt || null,
        trade.duration || null,
        trade.isOpen ? 1 : 0,
        JSON.stringify(trade.soldAssets || []),
        JSON.stringify(trade.soldAmounts || []),
        JSON.stringify(trade.feeAssets || []),
        JSON.stringify(trade.feeAmounts || []),
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
  const account = await getAccount(accountName)
  account.eventEmitter.on(SubscriptionChannel.Trades, callback)
  return () => account.eventEmitter.off(SubscriptionChannel.Trades, callback)
}

export async function computeTrades(
  accountName: string,
  progress: ProgressCallback = noop
): Promise<void> {
  const account = await getAccount(accountName)

  // Clear existing trades and relationships
  await account.execute("DELETE FROM trade_audit_logs")
  await account.execute("DELETE FROM trade_transactions")
  await account.execute("DELETE FROM trades")

  // Get all audit logs ordered by timestamp
  await progress([0, "Fetching audit logs"])
  const auditLogs = await getAuditLogs(
    accountName,
    "SELECT * FROM audit_logs ORDER BY timestamp ASC, id ASC"
  )

  if (auditLogs.length === 0) {
    await progress([100, "No audit logs found"])
    return
  }

  await progress([10, `Processing ${auditLogs.length} audit logs`])

  // Group audit logs by asset only (assetId already includes platform)
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

  // Track audit log relationships for bulk insert
  const tradeAuditLogs: [string, string][] = []
  // Track transaction relationships for bulk insert
  const tradeTransactions: [string, string][] = []

  // Process each asset group to find trade periods
  for (const [assetId, logs] of Object.entries(assetGroups)) {
    // Sort logs by timestamp to ensure chronological processing
    logs.sort((a, b) => a.timestamp - b.timestamp)

    let currentTrade: Trade | null = null
    let balance = new Big(0)

    for (const log of logs) {
      const change = new Big(log.change)

      // Calculate the new balance by adding the change
      balance = balance.plus(change)

      // If balance is becoming non-zero from zero, start a new trade
      if (balance.gt(0) && currentTrade === null) {
        const tradeId = hashString(`trade_${assetId}_${log.timestamp}_${log.id}`)

        currentTrade = {
          amount: balance.toNumber(),
          assetId,
          balance: balance.toNumber(),
          createdAt: log.timestamp,
          feeAmounts: [],
          feeAssets: [],
          id: tradeId,
          isOpen: true,
          soldAmounts: [],
          soldAssets: [],
        }

        // Add to the relationship mapping for bulk insert
        tradeAuditLogs.push([tradeId, log.id])

        // Add transaction relationship if txId exists
        if (log.txId) {
          tradeTransactions.push([tradeId, log.txId])
        }

        // If this is a buy/deposit operation, track what was sold
        if (change.gt(0) && log.txId) {
          const transactions = await getTransactionsByTxHash(accountName, log.txId)

          for (const tx of transactions) {
            if (tx.outgoingAsset && tx.outgoingAsset !== assetId && tx.outgoing) {
              // Add the sold asset if it doesn't exist in the array
              const soldAssetIndex = currentTrade.soldAssets.indexOf(tx.outgoingAsset)
              if (soldAssetIndex === -1) {
                currentTrade.soldAssets.push(tx.outgoingAsset)
                currentTrade.soldAmounts.push(tx.outgoing)
              } else {
                // Add to the existing amount using Big.js
                currentTrade.soldAmounts[soldAssetIndex] = new Big(
                  currentTrade.soldAmounts[soldAssetIndex]
                )
                  .plus(new Big(tx.outgoing))
                  .toString()
              }
            }

            if (tx.feeAsset && tx.fee) {
              // Add the fee asset if it doesn't exist in the array
              const feeAssetIndex = currentTrade.feeAssets.indexOf(tx.feeAsset)
              if (feeAssetIndex === -1) {
                currentTrade.feeAssets.push(tx.feeAsset)
                currentTrade.feeAmounts.push(tx.fee)
              } else {
                // Add to the existing fee using Big.js
                currentTrade.feeAmounts[feeAssetIndex] = new Big(
                  currentTrade.feeAmounts[feeAssetIndex]
                )
                  .plus(new Big(tx.fee))
                  .toString()
              }
            }

            // Add transaction relationship
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

          // Update sold assets and fees if this is a transaction
          const transactions = await getTransactionsByTxHash(accountName, log.txId)

          for (const tx of transactions) {
            if (tx.outgoingAsset && tx.outgoingAsset !== assetId && tx.outgoing) {
              const soldAssetIndex = currentTrade.soldAssets.indexOf(tx.outgoingAsset)
              if (soldAssetIndex === -1) {
                currentTrade.soldAssets.push(tx.outgoingAsset)
                currentTrade.soldAmounts.push(tx.outgoing)
              } else {
                // Add to the existing amount using Big.js
                currentTrade.soldAmounts[soldAssetIndex] = new Big(
                  currentTrade.soldAmounts[soldAssetIndex]
                )
                  .plus(new Big(tx.outgoing))
                  .toString()
              }
            }

            if (tx.feeAsset && tx.fee) {
              const feeAssetIndex = currentTrade.feeAssets.indexOf(tx.feeAsset)
              if (feeAssetIndex === -1) {
                currentTrade.feeAssets.push(tx.feeAsset)
                currentTrade.feeAmounts.push(tx.fee)
              } else {
                // Add to the existing fee using Big.js
                currentTrade.feeAmounts[feeAssetIndex] = new Big(
                  currentTrade.feeAmounts[feeAssetIndex]
                )
                  .plus(new Big(tx.fee))
                  .toString()
              }
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
