import Big from "big.js"
import {
  AccountPnL,
  AuditLog,
  EventCause,
  MyAsset,
  ProgressCallback,
  ResolutionString,
  SqlParam,
  SubscriptionChannel,
  TaskPriority,
  TaskTrigger,
  Timestamp,
  Trade,
  TRADE_TYPES,
  TradePnL,
  TradeStatus,
  TradeType,
} from "src/interfaces"
import { getAssetTicker } from "src/utils/assets-utils"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { formatDate, ONE_DAY } from "src/utils/formatting-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"
import { floorTimestamp, hashString, isTestEnvironment, noop, writesAllowed } from "src/utils/utils"

import { getAccount } from "../accounts-api"
import { getMyAssets } from "./assets-api"
import { getAuditLogOrderQuery, getAuditLogs } from "./audit-logs-api"
import { getAssetPriceMap, getPricesForAsset } from "./daily-prices-api"
import { getValue, setValue } from "./kv-api"
import { enqueueTask } from "./server-tasks-api"
import { getTransaction } from "./transactions-api"

const SCHEMA_VERSION = 17

export async function getAccountWithTrades(accountName: string) {
  const account = await getAccount(accountName)
  if (!writesAllowed) return account

  const schemaVersion = await getValue(accountName, `trade_schema_version`, 0)

  if (schemaVersion < SCHEMA_VERSION) {
    await account.execute(sql`DROP TABLE IF EXISTS trade_audit_logs`)
    await account.execute(sql`DROP TABLE IF EXISTS trade_transactions`)
    await account.execute(sql`DROP TABLE IF EXISTS trade_tags`)
    await account.execute(sql`DROP TABLE IF EXISTS trade_pnl`)
    await account.execute(sql`DROP TABLE IF EXISTS trades`)

    await account.execute(sql`
      CREATE TABLE trades (
        id VARCHAR PRIMARY KEY,
        tradeNumber INTEGER NOT NULL,
        assetId VARCHAR NOT NULL,
        amount VARCHAR NOT NULL,
        balance VARCHAR NOT NULL,
        createdAt INTEGER NOT NULL,
        closedAt INTEGER,
        duration INTEGER,
        tradeStatus VARCHAR NOT NULL,
        tradeType VARCHAR NOT NULL,
        cost JSON,
        fees JSON,
        proceeds JSON,
        deposits JSON,
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

    await account.execute(sql`
      CREATE TABLE trade_pnl (
        id VARCHAR PRIMARY KEY,
        trade_id VARCHAR NOT NULL,
        timestamp INTEGER NOT NULL,
        positionValue VARCHAR NOT NULL,
        cost VARCHAR NOT NULL,
        proceeds VARCHAR NOT NULL,
        fees VARCHAR NOT NULL,
        deposits VARCHAR NOT NULL,
        pnl VARCHAR NOT NULL,
        FOREIGN KEY (trade_id) REFERENCES trades(id)
      );
    `)

    await account.execute(sql`
      INSERT OR IGNORE INTO key_value (key, value)
      VALUES ('trade_seq', 0);
    `)

    await setValue(accountName, `trade_schema_version`, SCHEMA_VERSION)
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
        proceeds: JSON.parse(String(row[12] || "[]")),
        deposits: JSON.parse(String(row[13] || "[]")),
        txIds: row[14] ? String(row[14]).split(",") : undefined,
        auditLogIds: row[15] ? String(row[15]).split(",") : undefined,
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
        id, tradeNumber, assetId, amount, balance, createdAt, closedAt, duration, tradeStatus, tradeType, cost, fees, proceeds, deposits
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        JSON.stringify(trade.proceeds || []),
        JSON.stringify(trade.deposits || []),
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

export async function upsertTradePnls(accountName: string, tradePnls: TradePnL[]): Promise<void> {
  const account = await getAccountWithTrades(accountName)

  try {
    await account.executeMany(
      `INSERT OR REPLACE INTO trade_pnl (
        id, trade_id, timestamp, positionValue, cost, proceeds, fees, deposits, pnl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      tradePnls.map((pnl) => [
        pnl.id,
        pnl.tradeId,
        pnl.timestamp,
        pnl.positionValue,
        pnl.cost,
        pnl.proceeds,
        pnl.fees,
        pnl.deposits,
        pnl.pnl,
      ])
    )

    account.eventEmitter.emit(SubscriptionChannel.TradePnl, EventCause.Updated)
  } catch (error) {
    throw new Error(`Failed to add or replace trade pnl: ${error}`)
  }
}

export async function upsertTradePnl(accountName: string, tradePnl: TradePnL): Promise<void> {
  return upsertTradePnls(accountName, [tradePnl])
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

export async function deleteTrades(accountName: string): Promise<void> {
  // TODO: delete trades that are older than since
  const account = await getAccountWithTrades(accountName)
  await account.execute("DELETE FROM trade_audit_logs")
  await account.execute("DELETE FROM trade_transactions")
  await account.execute("DELETE FROM trade_pnl")
  await account.execute("DELETE FROM trades")
  await setValue(accountName, "trade_seq", 0)
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

export async function subscribeToPnl(accountName: string, callback: (cause: EventCause) => void) {
  return createSubscription(accountName, SubscriptionChannel.TradePnl, callback)
}

function derivadeTradeId(assetId: string, createdAt: number) {
  return `${hashString(`${assetId}_${createdAt}`)}`
}

export async function invalidateTrades(accountName: string, newValue: Timestamp) {
  const existing = (await getValue<Timestamp>(accountName, "tradesCursor", 0)) as Timestamp

  if (newValue < existing) {
    await setValue(accountName, "tradesCursor", newValue)
    await deleteTrades(accountName)
  }
}

export async function invalidateTradePnl(accountName: string, newValue: Timestamp) {
  const existing = (await getValue<Timestamp>(accountName, "tradePnlCursor", 0)) as Timestamp

  if (newValue < existing) {
    await setValue(accountName, "tradePnlCursor", newValue)
  }
}

async function processTransactionForTrade(
  accountName: string,
  trade: Trade,
  txId: string,
  assetId: string,
  progress: ProgressCallback
): Promise<void> {
  const tx = await getTransaction(accountName, txId)
  if (!tx) throw new Error(`Transaction with id ${txId} not found`)

  const priceMap = await getAssetPriceMap(accountName, tx.timestamp)

  // Deposits
  if (tx.incomingAsset && tx.incoming && tx.incomingAsset === assetId && tx.type === "Deposit") {
    const assetPrice = priceMap[tx.incomingAsset]?.value || 0
    if (!assetPrice && !isTestEnvironment)
      await progress([
        undefined,
        `Warning: price not found for ${tx.incomingAsset} (Trade Id: ${trade.id})`,
      ])
    trade.deposits.push([
      tx.incomingAsset,
      tx.incoming,
      assetPrice ? Big(assetPrice).mul(tx.incoming).toString() : "0",
      txId,
      tx.timestamp,
    ])
  }

  // Withdrawals
  if (tx.outgoingAsset && tx.outgoing && tx.outgoingAsset === assetId && tx.type === "Withdraw") {
    const assetPrice = priceMap[tx.outgoingAsset]?.value || 0
    if (!assetPrice && !isTestEnvironment)
      await progress([
        undefined,
        `Warning: price not found for ${tx.outgoingAsset} (Trade Id: ${trade.id})`,
      ])
    trade.deposits.push([
      tx.outgoingAsset,
      `-${tx.outgoing}`,
      assetPrice ? Big(assetPrice).mul(`-${tx.outgoing}`).toString() : "0",
      txId,
      tx.timestamp,
    ])
  }

  // Cost
  if (tx.outgoingAsset && tx.outgoing && tx.incomingAsset === assetId) {
    const assetPrice = priceMap[tx.outgoingAsset]?.value || 0
    if (!assetPrice && !isTestEnvironment)
      await progress([
        undefined,
        `Warning: price not found for ${tx.outgoingAsset} (Trade Id: ${trade.id})`,
      ])
    trade.cost.push([
      tx.outgoingAsset,
      `-${tx.outgoing}`,
      assetPrice ? Big(assetPrice).mul(`-${tx.outgoing}`).toString() : "0",
      tx.incoming,
      txId,
      tx.timestamp,
    ])
  }

  // Proceeds
  if (tx.incomingAsset && tx.incoming && tx.outgoingAsset === assetId) {
    const assetPrice = priceMap[tx.incomingAsset]?.value || 0
    if (!assetPrice && !isTestEnvironment)
      await progress([
        undefined,
        `Warning: price not found for ${tx.incomingAsset} (Trade Id: ${trade.id})`,
      ])
    trade.proceeds.push([
      tx.incomingAsset,
      tx.incoming,
      assetPrice ? Big(assetPrice).mul(tx.incoming).toString() : "0",
      tx.outgoing,
      txId,
      tx.timestamp,
    ])
  }

  // Fees
  if (tx.feeAsset && tx.fee && tx.feeAsset === assetId) {
    const assetPrice = priceMap[tx.feeAsset]?.value || 0
    if (!assetPrice && !isTestEnvironment)
      await progress([
        undefined,
        `Warning: price not found for ${tx.feeAsset} (Trade Id: ${trade.id})`,
      ])
    trade.fees.push([
      tx.feeAsset,
      tx.fee,
      assetPrice ? Big(assetPrice).mul(tx.fee).toString() : "0",
      txId,
      tx.timestamp,
    ])
  }
}

export type ComputeTradesRequest = {
  since?: Timestamp
}

export async function computeTrades(
  accountName: string,
  progress: ProgressCallback = noop,
  request: ComputeTradesRequest = {},
  _signal?: AbortSignal
): Promise<void> {
  let { since } = request

  const account = await getAccountWithTrades(accountName)
  if (since === undefined) {
    since = (await getValue<Timestamp>(accountName, "tradesCursor", 0)) as Timestamp
  }

  if (since !== 0) {
    await progress([0, `Refreshing trades starting ${formatDate(since)}`])
  }

  await progress([0, "Fetching audit logs"])
  const orderQuery = await getAuditLogOrderQuery(true)
  const auditLogs = await getAuditLogs(
    accountName,
    since === 0
      ? `SELECT * FROM audit_logs ${orderQuery}`
      : `SELECT * FROM audit_logs WHERE timestamp > ? ${orderQuery}`,
    since === 0 ? undefined : [since]
  )

  if (auditLogs.length === 0) {
    await progress([100, "No audit logs found"])
    return
  }

  await progress([2.5, `Processing ${auditLogs.length} audit logs`])

  const myAssets = await getMyAssets(accountName)
  const assetsMap: Record<string, MyAsset> = myAssets.reduce((acc, asset) => {
    acc[asset.id] = asset
    return acc
  }, {})

  const allAssetGroups: Record<string, AuditLog[]> = {}

  auditLogs.forEach((log) => {
    const key = log.assetId
    if (!allAssetGroups[key]) {
      allAssetGroups[key] = []
    }
    allAssetGroups[key].push(log)
  })

  const assetGroups: Record<string, AuditLog[]> = {}

  let skippedAssets = 0

  for (const [key, logs] of Object.entries(allAssetGroups)) {
    if (!assetsMap[key] || !assetsMap[key].coingeckoId) {
      skippedAssets++
    } else {
      assetGroups[key] = logs
    }
  }

  await progress([
    6,
    `Found ${Object.keys(assetGroups).length} asset groups (skipped ${skippedAssets} unlisted assets)`,
  ])

  const existingTrades: Trade[] =
    since === 0
      ? []
      : await getTrades(
          accountName,
          "SELECT * FROM trades WHERE tradeStatus = 'open' ORDER BY createdAt ASC"
        )

  if (existingTrades.length > 0) {
    await progress([6, `Found ${existingTrades.length} open trades`])

    for (const trade of existingTrades) {
      trade.deposits = trade.deposits.filter((x) => x[4] <= since)
      trade.fees = trade.fees.filter((x) => x[4] <= since)
      trade.proceeds = trade.proceeds.filter((x) => x[5] <= since)
      trade.cost = trade.cost.filter((x) => x[5] <= since)
      trade.amount = 0
      trade.balance = 0
      trade.deposits.forEach(([assetId, amount]) => {
        if (assetId === trade.assetId)
          trade.balance = new Big(trade.balance).plus(amount).toNumber()
      })
      trade.proceeds.forEach(([assetId, amount]) => {
        if (assetId === trade.assetId)
          trade.balance = new Big(trade.balance).plus(amount).toNumber()
      })
      trade.cost.forEach(([, , , exposure]) => {
        trade.balance = new Big(trade.balance).plus(exposure).toNumber()
      })
      trade.fees.forEach(([assetId, amount]) => {
        if (assetId === trade.assetId)
          trade.balance = new Big(trade.balance).plus(amount).toNumber()
      })
      trade.amount = Big(trade.balance).abs().toNumber()
    }
  }

  const trades: Trade[] = []
  let processedGroups = 0

  const tradeAuditLogs: [string, string][] = []
  const tradeTransactions: [string, string][] = []
  let oldestClosedTrade = 0

  for (const [assetId, logs] of Object.entries(assetGroups)) {
    let currentTrade: Trade | null = null
    let balance = new Big(0)

    if (existingTrades.length > 0) {
      currentTrade = existingTrades.find((x) => x.assetId === assetId) ?? null
      balance = new Big(currentTrade?.balance ?? 0)
    }

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i]
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
          deposits: [],
          fees: [],
          id: tradeId,
          proceeds: [],
          tradeNumber: -1,
          tradeStatus: "open",
          tradeType,
        }

        tradeAuditLogs.push([tradeId, log.id])
        if (log.txId) {
          tradeTransactions.push([tradeId, log.txId])
          // Track transactions for cost/proceeds/fees
          await processTransactionForTrade(accountName, currentTrade, log.txId, assetId, progress)
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

        // Add the transaction relationship if txId exists and it was not previously added
        if (log.txId) {
          // TODO8 this can be optimized by using a map
          if (
            !tradeTransactions.some(
              ([tradeId, txId]) => tradeId === currentTrade.id && txId === log.txId
            )
          ) {
            tradeTransactions.push([currentTrade.id, log.txId])

            // Update cost, proceeds and fees if this is a transaction
            await processTransactionForTrade(accountName, currentTrade, log.txId, assetId, progress)
          }
        }

        // Check if we need to close the current trade and start a new one
        const previousLog = logs[i - 1]
        const nextLog = logs[i + 1]
        const tickContinuation = previousLog && log.timestamp === previousLog.timestamp
        const tickNotFinished = nextLog && log.timestamp === nextLog.timestamp

        // It's possible the type was set incorrectly
        if (tickContinuation && !balance.eq(0)) {
          currentTrade.tradeType = balance.gt(0) ? TRADE_TYPES[0] : TRADE_TYPES[1]
        }

        if (
          !tickNotFinished &&
          ((currentTrade.tradeType === TRADE_TYPES[0] && balance.lt(0)) || // Long position going negative
            (currentTrade.tradeType === TRADE_TYPES[1] && balance.gt(0)) || // Short position going positive
            balance.eq(0)) // Position fully closed
        ) {
          // Close current trade
          currentTrade.tradeStatus = "closed"
          currentTrade.closedAt = log.timestamp
          currentTrade.duration = log.timestamp - currentTrade.createdAt
          trades.push(currentTrade)

          if (currentTrade.closedAt > oldestClosedTrade) {
            oldestClosedTrade = currentTrade.closedAt
          }

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
              deposits: [],
              fees: [],
              id: newTradeId,
              proceeds: [],
              tradeNumber: -1,
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
      6 + Math.floor((processedGroups / Object.keys(assetGroups).length) * 19),
      `Processed all trades for ${getAssetTicker(assetId)}`,
    ])
  }

  // these are trades with no new audit logs
  existingTrades.forEach((trade) => {
    if (!trades.find((t) => t.id === trade.id)) {
      trades.push(trade)
    }
  })

  // Save trades
  if (trades.length > 0) {
    trades.sort((a, b) => a.createdAt - b.createdAt)
    const seq = await getValue(accountName, "trade_seq", 0)
    const newTrades: Trade[] = []
    for (const trade of trades) {
      if (trade.tradeNumber === -1) {
        newTrades.push(trade)
      }
    }
    newTrades.forEach((trade, index) => {
      trade.tradeNumber = seq + index + 1
    })
    if (newTrades.length > 0) {
      const latestTradeNumber = seq + newTrades.length
      await setValue(accountName, "trade_seq", latestTradeNumber)
    }

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

  if (oldestClosedTrade > 0) {
    const newCursor = oldestClosedTrade
    await progress([25, `Setting trades cursor to ${formatDate(newCursor)}`])
    await setValue(accountName, "tradesCursor", newCursor)
  }

  await progress([25, `Computed ${trades.length} trades`])
  await computePnl(accountName, progress, trades, since === 0 ? 0 : undefined)
}

export function enqueueRefreshTrades(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Refreshing trades from audit logs.",
    determinate: true,
    function: async (progress, signal) => {
      await computeTrades(accountName, progress, undefined, signal)
    },
    name: "Refresh trades",
    priority: TaskPriority.Low,
    trigger,
  })
}

export function enqueueRecomputeTrades(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Recomputing trades from audit logs.",
    determinate: true,
    function: async (progress, signal) => {
      await deleteTrades(accountName)
      await computeTrades(accountName, progress, { since: 0 }, signal)
    },
    name: "Recompute trades",
    priority: TaskPriority.Low,
    trigger,
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

export async function getTradePnL(
  accountName: string,
  tradeId: string,
  query = "SELECT * FROM trade_pnl WHERE trade_id = ? ORDER BY timestamp ASC",
  params: SqlParam[] = [tradeId]
): Promise<TradePnL[]> {
  const account = await getAccountWithTrades(accountName)
  try {
    const result = await account.execute(query, params)
    /* eslint-disable sort-keys-fix/sort-keys-fix */
    return result.map((row) => ({
      id: row[0] as string,
      tradeId: row[1] as string,
      timestamp: row[2] as number,
      positionValue: row[3] as string,
      cost: row[4] as string,
      proceeds: row[5] as string,
      fees: row[6] as string,
      deposits: row[7] as string,
      pnl: row[8] as string,
    }))
    /* eslint-enable */
  } catch (error) {
    throw new Error(`Failed to get pnl for trade: ${error}`)
  }
}

export async function getAccountPnL(
  accountName: string,
  start?: number,
  end?: number
): Promise<AccountPnL[]> {
  const account = await getAccountWithTrades(accountName)
  try {
    let query = "SELECT * FROM trade_pnl"
    const params: SqlParam[] = []

    if (start && end) {
      query += " WHERE timestamp >= ? AND timestamp <= ?"
      params.push(start, end)
    } else if (start) {
      query += " WHERE timestamp >= ?"
      params.push(start)
    } else if (end) {
      query += " WHERE timestamp <= ?"
      params.push(end)
    }

    query += " ORDER BY timestamp ASC"

    const result = await account.execute(query, params)
    /* eslint-disable sort-keys-fix/sort-keys-fix */
    const tradePnls: TradePnL[] = result.map((row) => ({
      id: row[0] as string,
      tradeId: row[1] as string,
      timestamp: row[2] as number,
      positionValue: row[3] as string,
      cost: row[4] as string,
      proceeds: row[5] as string,
      fees: row[6] as string,
      deposits: row[7] as string,
      pnl: row[8] as string,
    }))
    /* eslint-enable */

    // Group by timestamp and carry forward latest values for each trade
    const timestampMap = new Map<number, AccountPnL>()
    const latestTradeValues = new Map<string, TradePnL>()

    // Get all unique timestamps
    const timestamps = Array.from(new Set(tradePnls.map((p) => p.timestamp))).sort()

    for (const timestamp of timestamps) {
      // Update latest values for trades that have records at this timestamp
      const recordsAtTimestamp = tradePnls.filter((p) => p.timestamp === timestamp)
      for (const record of recordsAtTimestamp) {
        latestTradeValues.set(record.tradeId, record)
      }

      // Sum up the latest values from all trades using Big.js
      let positionValue = new Big(0)
      let cost = new Big(0)
      let proceeds = new Big(0)
      let fees = new Big(0)
      let deposits = new Big(0)
      let pnl = new Big(0)

      for (const tradeRecord of latestTradeValues.values()) {
        positionValue = positionValue.plus(tradeRecord.positionValue)
        cost = cost.plus(tradeRecord.cost)
        proceeds = proceeds.plus(tradeRecord.proceeds)
        fees = fees.plus(tradeRecord.fees)
        deposits = deposits.plus(tradeRecord.deposits)
        pnl = pnl.plus(tradeRecord.pnl)
      }

      timestampMap.set(timestamp, {
        cost: cost.toString(),
        deposits: deposits.toString(),
        fees: fees.toString(),
        pnl: pnl.toString(),
        positionValue: positionValue.toString(),
        proceeds: proceeds.toString(),
        timestamp,
      })
    }

    return Array.from(timestampMap.values()).sort((a, b) => a.timestamp - b.timestamp)
  } catch (error) {
    throw new Error(`Failed to get account pnl: ${error}`)
  }
}

export async function computePnl(
  accountName: string,
  progress: ProgressCallback = noop,
  trades: Trade[],
  since?: number
): Promise<void> {
  const account = await getAccountWithTrades(accountName)

  if (since === undefined) {
    since = (await getValue<Timestamp>(accountName, "tradePnlCursor", 0)) as Timestamp
  }

  if (since !== 0) {
    await progress([25, `Refreshing PnL starting ${formatDate(since)}`])
    await account.execute(
      "DELETE FROM trade_pnl WHERE trade_id IN (SELECT id FROM trades WHERE createdAt >= ?)",
      [since]
    )
  } else {
    await account.execute("DELETE FROM trade_pnl")
  }

  if (trades.length === 0) {
    await progress([100, "No trades found"])
    return
  }

  await progress([30, `Computing PnL for ${trades.length} trades`])

  const tradePnls: TradePnL[] = []
  let processedTrades = 0
  let latestTimestamp = 0
  const orderQuery = await getAuditLogOrderQuery()

  for (const trade of trades) {
    // Get daily prices for the asset during the trade period
    const startTime = floorTimestamp(trade.createdAt, "1D" as ResolutionString)
    const endTime = trade.closedAt
      ? floorTimestamp(trade.closedAt, "1D" as ResolutionString)
      : floorTimestamp(Date.now(), "1D" as ResolutionString)

    // Add genesis entry (one day before trade creation)
    const genesisTime = startTime - ONE_DAY
    const genesisId = `${trade.id}_${genesisTime}`
    tradePnls.push({
      cost: "0",
      deposits: "0",
      fees: "0",
      id: genesisId,
      pnl: "0",
      positionValue: "0",
      proceeds: "0",
      timestamp: genesisTime,
      tradeId: trade.id,
    })

    const prices = await getPricesForAsset(
      accountName,
      trade.assetId,
      undefined,
      startTime,
      endTime
    )

    // Calculate PnL for each day
    for (const price of prices) {
      const bucketStart = price.time * 1000
      const bucketEnd = bucketStart + ONE_DAY

      // Find the latest audit log before or at this timestamp to get the balance
      const [latestLog] = await getAuditLogs(
        accountName,
        `SELECT * FROM audit_logs WHERE timestamp <= ? AND assetId = ? ${orderQuery} LIMIT 1`,
        [bucketEnd, trade.assetId]
      )

      if (bucketStart > latestTimestamp) {
        latestTimestamp = bucketStart
      }

      const balance = latestLog ? new Big(latestLog.balance) : new Big(0)
      const positionValue = new Big(price.value).mul(balance)

      // Calculate total cost and proceeds in USD using Big.js
      const cost = trade.cost.reduce(
        (sum, [_assetId, _amount, usdValue, _exposure, _txId, txTimestamp]) =>
          txTimestamp <= bucketEnd ? sum.plus(usdValue) : sum,
        new Big(0)
      )
      const proceeds = trade.proceeds.reduce(
        (sum, [_assetId, _amount, usdValue, _cost, _txId, txTimestamp]) =>
          txTimestamp <= bucketEnd ? sum.plus(usdValue) : sum,
        new Big(0)
      )
      const fees = trade.fees.reduce(
        (sum, [_assetId, _amount, usdValue, _txId, txTimestamp]) =>
          txTimestamp <= bucketEnd ? sum.plus(usdValue) : sum,
        new Big(0)
      )
      const deposits = trade.deposits.reduce(
        (sum, [_assetId, _amount, usdValue, _txId, txTimestamp]) =>
          txTimestamp <= bucketEnd ? sum.plus(usdValue) : sum,
        new Big(0)
      )
      const pnl = positionValue.plus(cost).plus(proceeds).plus(fees).minus(deposits)

      const pnlId = `${trade.id}_${bucketStart}`
      tradePnls.push({
        cost: cost.toString(),
        deposits: deposits.toString(),
        fees: fees.toString(),
        id: pnlId,
        pnl: pnl.toString(),
        positionValue: positionValue.toString(),
        proceeds: proceeds.toString(),
        timestamp: bucketStart,
        tradeId: trade.id,
      })
    }

    processedTrades++
    await progress([
      30 + Math.floor((processedTrades / trades.length) * 65),
      `Processed trade #${trade.tradeNumber} (${trade.tradeType} ${trade.amount} ${getAssetTicker(trade.assetId)})`,
    ])
  }

  await progress([95, `Saving ${tradePnls.length} records to disk`])

  if (tradePnls.length > 0) {
    await upsertTradePnls(accountName, tradePnls)
  }

  if (latestTimestamp > 0) {
    await progress([98, `Setting profit & loss cursor to ${formatDate(latestTimestamp)}`])
    await setValue(accountName, "tradePnlCursor", latestTimestamp)
  }

  await progress([100, "PnL computation completed"])
}
