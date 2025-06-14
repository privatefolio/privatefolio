import { PAIR_MAPPER, PRICE_APIS, PRICE_MAPPER } from "src/extensions/prices/providers"
import {
  ChartData,
  DailyPrice,
  MyAsset,
  ProgressCallback,
  ResolutionString,
  SqlParam,
  SubscriptionChannel,
  TaskPriority,
  TaskTrigger,
  Time,
  Timestamp,
} from "src/interfaces"
import { allPriceApiIds } from "src/settings/price-apis"
import { PRICE_API_PAGINATION, PRICE_APIS_META } from "src/settings/settings"
import { getAssetTicker } from "src/utils/assets-utils"
import { formatDate } from "src/utils/formatting-utils"
import { createSubscription } from "src/utils/sub-utils"
import { isTestEnvironment, noop } from "src/utils/utils"

import { getAccount } from "../accounts-api"
import { getMyAssets, patchAsset } from "./assets-api"
import { enqueueTask } from "./server-tasks-api"

type NewDailyPrice = Omit<DailyPrice, "id">

function deriveDailyPriceId(record: NewDailyPrice) {
  return `${record.assetId}_${record.timestamp}`
}

export async function upsertDailyPrices(
  accountName: string,
  records: DailyPrice[] | NewDailyPrice[]
) {
  const account = await getAccount(accountName)

  try {
    await account.executeMany(
      `INSERT OR REPLACE INTO daily_prices (
        id, assetId, timestamp, price, pair, priceApiId
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      records.map((record) => [
        "id" in record ? record.id : deriveDailyPriceId(record),
        record.assetId,
        record.timestamp,
        JSON.stringify(record.price) || null,
        record.pair || null,
        record.priceApiId || null,
      ])
    )
    account.eventEmitter.emit(SubscriptionChannel.DailyPrices)
  } catch (error) {
    throw new Error(`Failed to add or replace daily prices: ${error}`)
  }
}

export async function upsertDailyPrice(accountName: string, record: DailyPrice | NewDailyPrice) {
  return upsertDailyPrices(accountName, [record])
}

export async function getPricesForAsset(
  accountName: string,
  assetId: string,
  timestamp?: Timestamp,
  start?: Timestamp,
  end?: Timestamp
): Promise<ChartData[]> {
  if (assetId === "USDT" && !!timestamp) {
    return [{ time: timestamp / 1000, value: 1 }] as ChartData[]
  }

  const account = await getAccount(accountName)

  let query = `
    SELECT price FROM daily_prices
    WHERE assetId = ? 
  `
  if (timestamp && (start || end)) {
    throw new Error("You can only pass timestamp or start/end, not both")
  }

  const params: SqlParam[] = []

  if (timestamp) {
    query += " AND timestamp = ?"
    params.push(timestamp)
  }
  if (start && end) {
    query += " AND timestamp >= ? AND timestamp <= ?"
    params.push(start, end)
  } else if (start) {
    query += " AND timestamp >= ?"
    params.push(start)
  } else if (end) {
    query += " AND timestamp <= ?"
    params.push(end)
  }

  query += " ORDER BY timestamp ASC"

  const prices = await account.execute(query, [assetId, ...params])

  return prices.map((x) => JSON.parse(x[0] as string))
}

export async function getAssetPriceMap(
  accountName: string,
  timestamp: Timestamp = new Date().getTime()
): Promise<Record<string, ChartData>> {
  const account = await getAccount(accountName)

  const day: Timestamp = timestamp - (timestamp % 86400000)

  const prices = await account.execute(
    `
    SELECT assetId, price FROM daily_prices
    WHERE timestamp = ?
  `,
    [day]
  )

  return prices.reduce(
    (map: Record<string, ChartData>, x) => {
      map[x[0] as string] = JSON.parse(x[1] as string)
      return map
    },
    {
      USDT: { time: (day / 1000) as Time, value: 1 },
    }
  )
}

export async function getPriceCursor(
  accountName: string,
  assetId: string
): Promise<Timestamp | undefined> {
  const account = await getAccount(accountName)

  const query = `
    SELECT timestamp FROM daily_prices
    WHERE assetId = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `
  const prices = await account.execute(query, [assetId])

  if (prices.length === 0) {
    return undefined
  }

  return JSON.parse(prices[0][0] as string)
}

type FetchDailyPricesOptions = {
  /**
   * less than or equal to this timestamp
   */
  until?: number
}

export async function fetchDailyPrices(
  accountName: string,
  assetsParam?: MyAsset[],
  progress: ProgressCallback = noop,
  signal?: AbortSignal,
  options: FetchDailyPricesOptions = {}
) {
  let assets: MyAsset[]

  if (!assetsParam) {
    assets = await getMyAssets(accountName)
  } else {
    assets = assetsParam
  }

  await progress([0, `Fetching asset prices for ${assets.length} assets`])

  const now = Date.now()
  const today: Timestamp = now - (now % 86400000)

  const promises: (() => Promise<void>)[] = []

  for (let i = 1; i <= assets.length; i++) {
    // eslint-disable-next-line no-loop-func
    promises.push(async () => {
      const asset = assets[i - 1]

      if (!asset.coingeckoId && !isTestEnvironment) {
        await progress([undefined, `Skipped ${getAssetTicker(asset.id)}: No coingeckoId`])
        return
      }

      if (signal?.aborted) throw new Error(signal.reason)

      const preferredPriceApiId = asset.priceApiId
      const priceApiIds = preferredPriceApiId ? [preferredPriceApiId] : allPriceApiIds

      let since: Timestamp | undefined = await getPriceCursor(accountName, asset.id)
      let until: Timestamp | undefined = options.until || today

      if (!since) since = until - 86400000 * PRICE_API_PAGINATION - 1
      if (since === until) since = since - 1

      for (const priceApiId of priceApiIds) {
        try {
          while (true) {
            const priceApi = PRICE_APIS[priceApiId]
            const priceMapper = PRICE_MAPPER[priceApiId]
            const pairMapper = PAIR_MAPPER[priceApiId]

            if (!priceApi || !priceMapper || !pairMapper) {
              throw new Error(`Price API "${priceApiId}" is not supported`)
            }

            const pair = pairMapper(asset.id)

            const request = {
              limit: PRICE_API_PAGINATION,
              pair,
              since,
              timeInterval: "1d" as ResolutionString,
              until,
            }

            // console.log("Daily price api request:", request)

            const results = await priceApi(request)

            if (!preferredPriceApiId && results.length > 0) {
              patchAsset(accountName, asset.id, { priceApiId })
            }

            if (signal?.aborted) throw new Error(signal.reason)

            if (results.length === 0) {
              throw new Error(`${PRICE_APIS_META[priceApiId].name}: EmptyResponse`)
            }

            const documents = results.map((result) => {
              const price = priceMapper(result)
              const timestamp = (price.time as number) * 1000

              const doc: NewDailyPrice = {
                assetId: asset.id,
                pair,
                price,
                priceApiId,
                timestamp,
              }

              return doc
            })

            await upsertDailyPrices(accountName, documents)

            const start = (priceMapper(results[0]).time as number) * 1000
            const end = (priceMapper(results[results.length - 1]).time as number) * 1000

            await progress([
              undefined,
              `Fetched ${getAssetTicker(asset.id)} using ${
                PRICE_APIS_META[priceApiId].name
              } from ${formatDate(start)} to ${formatDate(end)}`,
            ])

            if (results.length !== PRICE_API_PAGINATION) {
              // reached listing date (genesis)
              break
            }

            until = start - 86400000
            since = start - 86400000 * PRICE_API_PAGINATION
          }
          break
        } catch (error) {
          await progress([undefined, `Skipped ${getAssetTicker(asset.id)}: ${error}`])
        }
      }
    })
  }

  let progressCount = 0

  await Promise.all(
    promises.map((fetchFn) =>
      fetchFn().then(async () => {
        progressCount += 1
        await progress([(progressCount / assets.length) * 100])
      })
    )
  )
}

export function enqueueFetchPrices(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Fetching price data for all assets.",
    determinate: true,
    function: async (progress, signal) => {
      await fetchDailyPrices(accountName, undefined, progress, signal)
    },
    name: "Fetch asset prices",
    priority: TaskPriority.Low,
    trigger,
  })
}

export async function deleteDailyPrices(accountName: string) {
  const account = await getAccount(accountName)
  await account.execute("DELETE FROM daily_prices")
}

export function enqueueDeleteAssetPrices(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Deleting price data for all assets.",
    determinate: true,
    function: async () => {
      await deleteDailyPrices(accountName)
    },
    name: "Delete asset prices",
    priority: TaskPriority.High,
    trigger,
  })
}

export async function subscribeToDailyPrices(accountName: string, callback: () => void) {
  return createSubscription(accountName, SubscriptionChannel.DailyPrices, callback)
}
