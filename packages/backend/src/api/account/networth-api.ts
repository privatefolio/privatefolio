import { formatDate } from "src/utils/formatting-utils"
import { createSubscription } from "src/utils/sub-utils"
import { noop } from "src/utils/utils"

import {
  Networth,
  ProgressCallback,
  SubscriptionChannel,
  TaskPriority,
  TaskTrigger,
  Time,
  Timestamp,
} from "../../interfaces"
import { getAccount } from "../accounts-api"
import { getBalances } from "./balances-api"
import { getAssetPriceMap } from "./daily-prices-api"
import { getValue, setValue } from "./kv-api"
import { enqueueTask } from "./server-tasks-api"

export async function invalidateNetworth(accountName: string, newValue: Timestamp) {
  const existing = (await getValue<Timestamp>(accountName, "networthCursor", 0)) as Timestamp

  if (newValue < existing) {
    await setValue(accountName, "networthCursor", newValue)
  }
}

export async function getNetworth(
  accountName: string,
  query = "SELECT * FROM networth"
  //
) {
  const account = await getAccount(accountName)
  const result = await account.execute(query)

  const cursor = (await getValue<Timestamp>(accountName, "networthCursor", 0)) as Timestamp
  const cursorAsTime = cursor / 1000

  const list: Networth[] = []
  for (const row of result) {
    if (row[1] && (row[1] as number) <= cursorAsTime) {
      list.push({
        change: row[3] as number,
        changePercentage: row[4] as number,
        time: row[1] as Time,
        timestamp: row[0] as Timestamp,
        value: row[2] as number,
      } as Networth)
    }
  }

  return list
}

const pageSize = 250

export async function computeNetworth(
  accountName: string,
  since?: Timestamp,
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  const account = await getAccount(accountName)

  if (since === undefined) {
    since = (await getValue<Timestamp>(accountName, "networthCursor", 0)) as Timestamp
  }

  if (signal?.aborted) throw new Error(signal.reason)

  const balances = await getBalances(
    accountName,
    `SELECT * FROM balances WHERE timestamp >= ? ORDER BY timestamp ASC`,
    [since]
  )

  if (signal?.aborted) throw new Error(signal.reason)

  const count = balances.length

  if (count === 0) {
    await account.execute(`DELETE FROM networth WHERE timestamp > ?`, [since])
    await progress([100, `No balances to compute networth`])
    return
  }

  await progress([5, `Computing networth for ${count} days`])

  const documentMap: Record<string, Networth> = {}
  let latestNetworth: Networth = {
    change: 0,
    changePercentage: 0,
    time: 0 as Time,
    timestamp: 0,
    value: 0,
  }

  for (let i = 0; i < count; i++) {
    const { timestamp, ...balanceMap } = balances[i]

    const priceMap = await getAssetPriceMap(accountName, timestamp as Timestamp)

    const totalValue = Object.keys(priceMap).reduce((acc, symbol) => {
      const price = priceMap[symbol]
      const balance = balanceMap[symbol]

      if (!price || !balance) return acc

      return acc + Math.round(price.value * Number(balance) * 100) / 100
    }, 0)

    const networth: Networth = {
      change: 0,
      changePercentage: 0,
      time: (timestamp / 1000) as Time,
      timestamp,
      value: totalValue,
    }

    if (i !== 0) {
      networth.change = Math.round((networth.value - latestNetworth.value) * 100) / 100
      networth.changePercentage =
        networth.change === 0 || latestNetworth.value === 0
          ? 0
          : Math.round((networth.change / latestNetworth.value) * 100 * 100) / 100
    }

    latestNetworth = networth
    documentMap[timestamp] = networth

    if (i % pageSize === 0) {
      await progress([
        10 + (i * 90) / count,
        `Computing networth starting ${formatDate(timestamp)}`,
      ])
    }
    if (signal?.aborted) throw new Error(signal.reason)
  }

  const docs = Object.values(documentMap)

  await progress([95, `Saving ${docs.length} records to the database`])
  await account.executeMany(
    `INSERT OR REPLACE INTO networth (timestamp, change, changePercentage, time, value) VALUES (?, ?, ?, ?, ?)`,
    docs.map((doc) => [doc.timestamp, doc.change, doc.changePercentage, doc.time, doc.value])
  )
  account.eventEmitter.emit(SubscriptionChannel.Networth)

  if (balances.length > 0) {
    const cursor = balances[balances.length - 1].timestamp
    await progress([99, `Setting networth cursor to ${formatDate(cursor)}`])
    await setValue(accountName, "networthCursor", cursor)
  }
}

export function enqueueRecomputeNetworth(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Recomputing historical networth.",
    determinate: true,
    function: async (progress, signal) => {
      await computeNetworth(accountName, 0, progress, signal)
    },
    name: "Recompute networth",
    priority: TaskPriority.Low,
    trigger,
  })
}

export function enqueueRefreshNetworth(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Refresh historical networth.",
    determinate: true,
    function: async (progress, signal) => {
      await computeNetworth(accountName, undefined, progress, signal)
    },
    name: "Refresh networth",
    priority: TaskPriority.Low,
    trigger,
  })
}

export async function subscribeToNetworth(accountName: string, callback: () => void) {
  return createSubscription(accountName, SubscriptionChannel.Networth, callback)
}
