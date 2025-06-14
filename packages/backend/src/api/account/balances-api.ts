import Big from "big.js"
import { EventCause, SqlParam } from "src/interfaces"
import { formatDate, ONE_DAY } from "src/utils/formatting-utils"
import { noop } from "src/utils/utils"

import {
  Balance,
  BalanceMap,
  ProgressCallback,
  SubscriptionChannel,
  TaskPriority,
  TaskTrigger,
  Timestamp,
} from "../../interfaces"
import { DB_OPERATION_PAGE_SIZE } from "../../settings/settings"
import { getAccount } from "../accounts-api"
import { countAuditLogs, getAuditLogs } from "./audit-logs-api"
import { getPricesForAsset } from "./daily-prices-api"
import { getValue, setValue } from "./kv-api"
import { invalidateNetworth } from "./networth-api"
import { enqueueTask } from "./server-tasks-api"

export async function getBalances(
  accountName: string,
  query = "SELECT * FROM balances ORDER BY timestamp ASC",
  params?: SqlParam[]
): Promise<BalanceMap[]> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      const value: BalanceMap = JSON.parse(row[1] as string)
      value.timestamp = row[0] as Timestamp
      return value
    })
  } catch (error) {
    throw new Error(`Failed to query balances: ${error}`)
  }
}

export async function invalidateBalances(accountName: string, newValue: Timestamp) {
  const existing = (await getValue<Timestamp>(accountName, "balancesCursor", 0)) as Timestamp

  if (newValue < existing) {
    await setValue("balancesCursor", newValue, accountName)
  }
}

export async function getBalancesAt(
  accountName: string,
  cursor: Timestamp = -1
): Promise<Balance[]> {
  const account = await getAccount(accountName)
  const balancesCursor =
    cursor !== -1
      ? cursor
      : ((await getValue<Timestamp>(accountName, "balancesCursor", 0)) as Timestamp)

  try {
    const result = await account.execute("SELECT * FROM balances WHERE timestamp = ?", [
      balancesCursor,
    ])
    const [timestamp, data] = result[0]
    const map = JSON.parse(data as string) as BalanceMap
    const balanceDocs = Object.keys(map).map((x) => ({ assetId: x, balance: map[x] }))

    const balances = await Promise.all(
      balanceDocs.map(async (x) => {
        const prices = await getPricesForAsset(accountName, x.assetId, timestamp as number)
        const price = prices.length > 0 ? prices[0] : undefined

        return {
          assetId: x.assetId,
          balance: x.balance as string,
          balanceN: Number(x.balance),
          id: `${timestamp as number}_${x.assetId}`,
          price,
          value: price ? price.value * Number(x.balance) : undefined,
        }
      })
    )

    return balances
  } catch (error) {
    return []
  }
}

export type GetHistoricalBalancesRequest = {
  limit?: number
  order?: "asc" | "desc"
  skip?: number
  symbol?: string
}

export type ComputeBalancesRequest = {
  pageSize?: number
  since?: Timestamp
  until?: Timestamp
}

export async function computeBalances(
  accountName: string,
  request: ComputeBalancesRequest = {},
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  const { pageSize = DB_OPERATION_PAGE_SIZE, until = Date.now() } = request
  let since = request.since

  // TODO8 skip assets tagged as spam

  const account = await getAccount(accountName)
  if (since === undefined) {
    since = (await getValue<Timestamp>(accountName, "balancesCursor", 0)) as Timestamp
  }

  if (since !== 0) {
    await progress([0, `Refreshing balances starting ${formatDate(since)}`])
  }

  const count =
    since === 0
      ? await countAuditLogs(accountName)
      : await countAuditLogs(accountName, "SELECT COUNT(*) FROM audit_logs WHERE timestamp >= ?", [
          since,
        ])
  await progress([0, `Computing balances for ${count} audit logs`])

  let recordsLength = 0
  let latestBalances: Omit<BalanceMap, "timestamp"> = {}

  let genesisDay: Timestamp = -1

  if (since !== 0) {
    try {
      const result = await account.execute("SELECT data FROM balances WHERE timestamp = ?", [
        since - 86400000,
      ])
      const data = result[0][0]
      latestBalances = typeof data === "string" ? JSON.parse(data) : latestBalances
    } catch {
      // ignore
    }
  } else {
    genesisDay = 0
  }

  let historicalBalances: Record<number, Omit<BalanceMap, "timestamp">> = {}

  let latestDay: Timestamp = 0

  for (let i = 0; i < count; i += pageSize) {
    if (signal?.aborted) throw new Error(signal.reason)

    const firstIndex = i + 1
    const lastIndex = Math.min(i + pageSize, count)

    await progress([Math.floor((i * 90) / count), `Processing logs ${firstIndex} to ${lastIndex}`])
    const logs = await getAuditLogs(
      accountName,
      "SELECT * FROM audit_logs WHERE timestamp >= ? ORDER BY timestamp ASC, changeN ASC, id ASC LIMIT ? OFFSET ?",
      [since, pageSize, i]
    )

    for (const log of logs) {
      const { assetId, change, timestamp } = log

      if (genesisDay === 0) {
        genesisDay = timestamp - (timestamp % 86400000)
      }

      const nextDay: Timestamp = timestamp - (timestamp % 86400000)

      // fill the daily gaps
      if (latestDay !== 0) {
        const daysDiff = (nextDay - latestDay) / 86400000
        if (daysDiff > 1) {
          for (let i = 1; i < daysDiff; i++) {
            const gapDay = latestDay + i * 86400000
            historicalBalances[gapDay] = Object.assign({}, latestBalances)
          }
        }
      }

      // update balance
      if (!latestBalances[assetId]) {
        latestBalances[assetId] = change
      } else {
        latestBalances[assetId] = new Big(latestBalances[assetId]).plus(new Big(change)).toFixed()
      }

      // update audit log
      log.balance = latestBalances[assetId] as string

      // remove zero balances
      if (latestBalances[assetId] === "0") {
        delete latestBalances[assetId]
      }

      // update historical balances
      if (!historicalBalances[nextDay]) {
        historicalBalances[nextDay] = Object.assign({}, latestBalances)
      } else if (latestBalances[assetId] !== "0") {
        historicalBalances[nextDay][assetId] = latestBalances[assetId]
      }

      latestDay = nextDay
    }

    await account.executeMany(
      "UPDATE audit_logs SET balance = ? WHERE id = ?",
      logs.map((log) => [log.balance as string, log.id])
    )
    account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Updated)

    const balanceIds = Object.keys(historicalBalances)

    recordsLength += balanceIds.length
    await account.executeMany(
      "INSERT OR REPLACE INTO balances (timestamp, data) VALUES (?, ?)",
      // eslint-disable-next-line no-loop-func
      balanceIds.map((timestamp) => [timestamp, JSON.stringify(historicalBalances[timestamp])])
    )

    await setValue("balancesCursor", latestDay, accountName)
    await progress([
      Math.floor((Math.min(i + pageSize, count) * 90) / count),
      `Processed ${balanceIds.length} daily balances`,
    ])

    // free memory
    historicalBalances = {}
  }

  const newCursor = since - (since % 86400000) - 86400000
  await progress([95, `Setting networth cursor to ${formatDate(newCursor)}`])
  await invalidateNetworth(accountName, newCursor)

  if (latestDay === 0 && since === 0) {
    await account.execute("DELETE FROM balances")
    return
  }
  if (latestDay === 0) latestDay = since

  await progress([96, `Filling balances to reach today`])
  for (let i = latestDay + 86400000; i <= until; i += 86400000) {
    historicalBalances[i] = latestBalances
    latestDay = i
  }

  // filling the day before the genesis day
  if (genesisDay > 0) {
    historicalBalances[genesisDay - ONE_DAY] = {}
  }

  if (Object.keys(historicalBalances).length > 0) {
    const balanceIds = Object.keys(historicalBalances)
    await account.executeMany(
      "INSERT OR REPLACE INTO balances (timestamp, data) VALUES (?, ?)",
      balanceIds.map((timestamp) => [
        Number(timestamp),
        JSON.stringify(historicalBalances[timestamp]),
      ])
    )
    recordsLength += balanceIds.length
  }

  await setValue("balancesCursor", latestDay, accountName)
  await progress([100, `Saved ${recordsLength} records to disk`])
}

export function enqueueRecomputeBalances(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Recomputing balances of owned assets.",
    determinate: true,
    function: async (progress, signal) => {
      await computeBalances(accountName, { since: 0 }, progress, signal)
    },
    name: "Recompute balances",
    priority: TaskPriority.Medium,
    trigger,
  })
}

export function enqueueRefreshBalances(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Refreshing balances of owned assets.",
    determinate: true,
    function: async (progress, signal) => {
      await computeBalances(accountName, undefined, progress, signal)
    },
    name: "Refresh balances",
    priority: TaskPriority.Medium,
    trigger,
  })
}

export async function deleteBalances(accountName: string) {
  const account = await getAccount(accountName)
  await account.execute("DELETE FROM balances")
  await account.execute("UPDATE audit_logs SET balance=null")
  account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Updated)
  account.eventEmitter.emit(SubscriptionChannel.Balances)
}

export function enqueueDeleteBalances(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Deleting all balances.",
    determinate: true,
    function: async () => {
      await deleteBalances(accountName)
    },
    name: "Delete balances",
    priority: TaskPriority.Low,
    trigger,
  })
}
