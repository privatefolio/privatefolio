import { PRICE_API_MATCHER } from "src/extensions/prices/providers"
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
import { BINANCE_PLATFORM_ID } from "src/settings/platforms"
import { allPriceApiIds, PriceApiId } from "src/settings/price-apis"
import { PRICE_API_PAGINATION, PRICE_APIS_META } from "src/settings/settings"
import { getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"
import { formatDate, ONE_DAY } from "src/utils/formatting-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"
import { floorTimestamp, noop, writesAllowed } from "src/utils/utils"

import { getAccount } from "../accounts-api"
import { getMyAssets, patchAsset } from "./assets-api"
import { getValue, setValue } from "./kv-api"
import { enqueueTask } from "./server-tasks-api"

const SCHEMA_VERSION = 2

export async function getAccountWithDailyPrices(accountName: string) {
  const account = await getAccount(accountName)
  if (!writesAllowed) return account

  const schemaVersion = await getValue(accountName, `daily_prices_schema_version`, 0)

  if (schemaVersion < SCHEMA_VERSION) {
    await account.execute(sql`
      CREATE TABLE IF NOT EXISTS daily_prices (
        id VARCHAR PRIMARY KEY NOT NULL UNIQUE,
        assetId VARCHAR NOT NULL,
        timestamp INTEGER NOT NULL,
        price JSON,
        pair VARCHAR,
        priceApiId VARCHAR,
        FOREIGN KEY (assetId) REFERENCES assets(id)
      );
    `)

    await account.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_daily_prices_asset_timestamp ON daily_prices (assetId, timestamp);
    `)

    await account.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_daily_prices_timestamp ON daily_prices (timestamp);
    `)

    await setValue(accountName, `daily_prices_schema_version`, SCHEMA_VERSION)
  }

  return account
}

type NewDailyPrice = Omit<DailyPrice, "id">

function deriveDailyPriceId(record: NewDailyPrice) {
  return `${record.assetId}_${record.timestamp}`
}

export async function upsertDailyPrices(
  accountName: string,
  records: DailyPrice[] | NewDailyPrice[]
) {
  const account = await getAccountWithDailyPrices(accountName)

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
  try {
    if (assetId === "USDT" && !!timestamp) {
      return [{ time: timestamp / 1000, value: 1 }] as ChartData[]
    }

    const account = await getAccountWithDailyPrices(accountName)

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
  } catch (error) {
    if (!writesAllowed) return []
    throw error
  }
}

export async function getAssetPriceMap(
  accountName: string,
  timestamp: Timestamp = new Date().getTime()
): Promise<Record<string, ChartData>> {
  try {
    const account = await getAccountWithDailyPrices(accountName)

    const day: Timestamp = floorTimestamp(timestamp, "1D" as ResolutionString)

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
  } catch (error) {
    if (!writesAllowed) return {}
    throw error
  }
}

export async function getPriceCursor(
  accountName: string,
  assetId: string
): Promise<Timestamp | undefined> {
  const account = await getAccountWithDailyPrices(accountName)

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

  await progress([1, `Fetching asset prices for ${assets.length} assets`])

  const now = Date.now()
  const today: Timestamp = floorTimestamp(now, "1D" as ResolutionString)

  const promises: (() => Promise<void>)[] = []

  for (let i = 1; i <= assets.length; i++) {
    // eslint-disable-next-line no-loop-func
    promises.push(async () => {
      const asset = assets[i - 1]
      const platform = getAssetPlatform(asset.id)

      if (!asset.coingeckoId && platform !== BINANCE_PLATFORM_ID) {
        await progress([undefined, `Skipped ${getAssetTicker(asset.id)}: No coingeckoId`])
        return
      }

      if (signal?.aborted) throw new Error(signal.reason)

      const preferredPriceApiId = asset.priceApiId
      let priceApiIds: PriceApiId[] = preferredPriceApiId ? [preferredPriceApiId] : allPriceApiIds

      if (!preferredPriceApiId && platform === BINANCE_PLATFORM_ID) {
        // priceApiIds.sort((a) => (a === "binance" ? -1 : 1))
        priceApiIds = ["binance"]
      }

      let since: Timestamp | undefined = await getPriceCursor(accountName, asset.id)
      let until: Timestamp | undefined = options.until || today + ONE_DAY

      if (!since) since = until - 86400000 * PRICE_API_PAGINATION - 1
      if (since === until) since = since - 1

      for (const priceApiId of priceApiIds) {
        try {
          while (true) {
            const priceApi = PRICE_API_MATCHER[priceApiId]

            if (!priceApi) {
              throw new Error(`Price API "${priceApiId}" is not supported`)
            }

            const pair = priceApi.getPair(asset.id)

            const request = {
              limit: PRICE_API_PAGINATION,
              pair,
              since,
              timeInterval: "1d" as ResolutionString,
              until,
            }

            // console.log("Daily price api request:", request)

            const results = await priceApi.queryPrices(request)

            if (!preferredPriceApiId && results.length > 0) {
              patchAsset(accountName, asset.id, { priceApiId })
            }

            if (signal?.aborted) throw new Error(signal.reason)

            if (results.length === 0) {
              throw new Error(`${PRICE_APIS_META[priceApiId].name}: EmptyResponse`)
            }

            const documents = results.map((result) => {
              const price = priceApi.mapToChartData(result)
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

            const start = (priceApi.mapToChartData(results[0]).time as number) * 1000
            const end = (priceApi.mapToChartData(results[results.length - 1]).time as number) * 1000

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

            if (asset.firstOwnedAt && start < asset.firstOwnedAt) {
              // await progress([
              //   undefined,
              //   `Skipping history before the first purchase of ${getAssetTicker(asset.id)} (${formatDate(asset.firstOwnedAt)})`,
              // ])
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

  const batchSize = 10
  await progress([2, `Fetching asset prices in batches of ${batchSize}`])

  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize)
    await Promise.all(batch.map((fetchFn) => fetchFn()))
    const completed = Math.min(i + batchSize, promises.length)
    await progress([(completed / assets.length) * 100])
  }
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
  const account = await getAccountWithDailyPrices(accountName)
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
