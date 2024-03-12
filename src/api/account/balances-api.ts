import Big from "big.js"
import { formatDate } from "src/utils/formatting-utils"
import { noop } from "src/utils/utils"

import { Balance, BalanceMap, Timestamp } from "../../interfaces"
import { DB_OPERATION_PAGE_SIZE } from "../../settings"
import { ProgressCallback } from "../../stores/task-store"
import { getPricesForAsset } from "../core/daily-prices-api"
import { getAccount } from "../database"
import { validateOperation } from "../database-utils"
import { countAuditLogs, indexAuditLogs } from "./audit-logs-api"
import { getValue, setValue } from "./kv-api"
import { invalidateNetworth } from "./networth-api"

export async function invalidateBalances(newValue: Timestamp, accountName: string) {
  const existing = (await getValue<Timestamp>("balancesCursor", 0, accountName)) as Timestamp

  if (newValue < existing) {
    await setValue("balancesCursor", newValue, accountName)
  }
}

export async function getBalancesAt(
  cursor: Timestamp = -1,
  accountName: string
): Promise<Balance[]> {
  const account = getAccount(accountName)
  const balancesCursor =
    cursor !== -1 ? cursor : await getValue<Timestamp>("balancesCursor", 0, accountName)

  try {
    const balanceMap = await account.balancesDB.get(String(balancesCursor))
    const { _id, _rev, timestamp, ...map } = balanceMap
    const balanceDocs = Object.keys(map).map((x) => ({ assetId: x, balance: map[x] }))

    const balances = await Promise.all(
      balanceDocs.map(async (x) => {
        const prices = await getPricesForAsset(x.assetId, timestamp)
        const price = prices.length > 0 ? prices[0] : undefined

        return {
          _id: `${_id}_${x.assetId}`,
          assetId: x.assetId,
          balance: x.balance as string,
          balanceN: Number(x.balance),
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
  skip?: number
  symbol?: string
}

export async function getHistoricalBalances(
  accountName: string,
  request: GetHistoricalBalancesRequest = {}
) {
  const { symbol, limit, skip } = request
  const account = getAccount(accountName)

  const { indexes } = await account.balancesDB.getIndexes()
  if (indexes.length === 1) {
    await account.balancesDB.createIndex({
      index: {
        fields: ["timestamp"],
        name: "timestamp",
      },
    })
  }

  const balances = await account.balancesDB.find({
    fields: symbol ? [symbol, "timestamp"] : undefined,
    limit,
    selector: symbol
      ? {
          // [symbol]: { $exists: true },
          timestamp: { $exists: true },
        }
      : {
          timestamp: { $exists: true },
        },
    skip,
    sort: [
      symbol
        ? {
            // symbol: "desc", TODO TESTME
            timestamp: "asc",
          }
        : { timestamp: "asc" },
    ],
  })

  return balances.docs
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

  const account = getAccount(accountName)
  if (since === undefined) {
    since = (await getValue<Timestamp>("balancesCursor", 0, accountName)) as Timestamp
  }

  if (since !== 0) {
    progress([0, `Refreshing balances starting ${formatDate(since)}`])
  }

  const { indexes } = await account.auditLogsDB.getIndexes()
  if (indexes.length === 1) {
    await indexAuditLogs(undefined, accountName)
  }

  const count =
    since === 0
      ? await countAuditLogs(accountName)
      : (await account.auditLogsDB.find({ selector: { timestamp: { $gte: since } } })).docs.length
  progress([0, `Computing balances for ${count} audit logs`])

  let recordsLength = 0
  let latestBalances: BalanceMap = {
    _id: "0",
    timestamp: 0,
  }
  if (since !== 0) {
    try {
      const latestBalancesDoc = await account.balancesDB.get(String(since - 86400000))
      const { _rev, ...latestBalancesMap } = latestBalancesDoc
      latestBalances = latestBalancesMap
    } catch {
      // ignore
    }
  }

  let historicalBalances: Record<number, BalanceMap> = {}

  let latestDay: Timestamp = 0

  for (let i = 0; i < count; i += pageSize) {
    if (signal?.aborted) {
      throw new Error(signal.reason)
    }

    const firstIndex = i + 1
    const lastIndex = Math.min(i + pageSize, count)

    progress([Math.floor((i * 90) / count), `Processing logs ${firstIndex} to ${lastIndex}`])
    const { docs: logs } = await account.auditLogsDB.find({
      limit: pageSize,
      selector: {
        changeN: { $exists: true },
        timestamp: { $gte: since },
      },
      skip: i,
      sort: ["timestamp", "changeN"],
    })

    // progress([(i * 100) / count, `Processing logs ${firstIndex} to ${lastIndex} - fetch complete`])
    for (const log of logs) {
      const { assetId, change, timestamp } = log

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
      latestBalances.timestamp = nextDay

      // update audit log
      log.balance = latestBalances[assetId] as string
      log.balanceN = Number(latestBalances[assetId])

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
    // progress([
    //   (i * 100) / count,
    //   `Processing logs ${firstIndex} to ${lastIndex} - compute complete`,
    // ])
    const logUpdates = await account.auditLogsDB.bulkDocs(logs)
    validateOperation(logUpdates)

    //
    // progress([
    //   (i * 100) / count,
    //   `Processing logs ${firstIndex} to ${lastIndex} - audit logs updated`,
    // ])

    const balancesIds = Object.keys(historicalBalances).map((x) => ({ id: x }))
    const { results: balancesDocs } = await account.balancesDB.bulkGet({ docs: balancesIds })

    // eslint-disable-next-line no-loop-func
    const balances: BalanceMap[] = balancesDocs.map((doc) => ({
      ...historicalBalances[doc.id],
      _id: doc.id,
      _rev: "ok" in doc.docs[0] ? doc.docs[0].ok._rev : undefined,
      timestamp: Number(doc.id),
    }))
    // console.log("ComputeBalances db results", balances)
    recordsLength += balances.length
    const balanceUpdates = await account.balancesDB.bulkDocs(balances)
    validateOperation(balanceUpdates)

    await setValue("balancesCursor", latestDay, accountName)
    progress([
      Math.floor((Math.min(i + pageSize, count) * 90) / count),
      `Processed ${balances.length} daily balances`,
    ])

    // free memory
    historicalBalances = {}
  }

  const newCursor = since - (since % 86400000) - 86400000
  progress([95, `Setting networth cursor to ${formatDate(newCursor)}`])
  await invalidateNetworth(newCursor, accountName)

  if (latestDay === 0 && since === 0) return
  if (latestDay === 0) latestDay = since

  // The balances remain the same until today
  progress([96, `Filling balances to reach today`])
  for (let i = latestDay + 86400000; i <= until; i += 86400000) {
    historicalBalances[i] = latestBalances
    latestDay = i
  }

  if (Object.keys(historicalBalances).length > 0) {
    const balancesIds = Object.keys(historicalBalances).map((x) => ({ id: x }))
    const { results: balancesDocs } = await account.balancesDB.bulkGet({ docs: balancesIds })
    // eslint-disable-next-line no-loop-func
    const balances: BalanceMap[] = balancesDocs.map((doc) => ({
      ...historicalBalances[doc.id],
      _id: doc.id,
      _rev: "ok" in doc.docs[0] ? doc.docs[0].ok._rev : undefined,
      timestamp: Number(doc.id),
    }))
    const balanceUpdates = await account.balancesDB.bulkDocs(balances)
    validateOperation(balanceUpdates)
    recordsLength += balances.length
  }

  await setValue("balancesCursor", latestDay, accountName)
  progress([100, `Saved ${recordsLength} records to disk`])
}
