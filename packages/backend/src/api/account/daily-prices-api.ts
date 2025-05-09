import {
  Asset,
  ChartData,
  DailyPrice,
  ProgressCallback,
  ResolutionString,
  TaskPriority,
  TaskTrigger,
  Time,
  Timestamp,
} from "src/interfaces"
import { PRICE_API_PAGINATION, PRICE_APIS_META, PriceApiId } from "src/settings"
import { getAssetTicker } from "src/utils/assets-utils"
import { formatDate } from "src/utils/formatting-utils"
import { noop } from "src/utils/utils"

import { getAccount } from "../accounts-api"
import { PAIR_MAPPER, PRICE_APIS, PRICE_MAPPER } from "../external/prices/providers"
import { getAssets, patchAsset } from "./assets-api"
import { enqueueTask } from "./server-tasks-api"

type NewDailyPrice = Omit<DailyPrice, "id">

function deriveDailyPriceId(record: NewDailyPrice) {
  // should we hashString?
  return `p_${record.assetId}_${record.priceApiId}_${record.pair}_${record.timestamp}`
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
  timestamp?: Timestamp
): Promise<ChartData[]> {
  if (assetId === "USDT" && !!timestamp) {
    return [{ time: timestamp / 1000, value: 1 }] as ChartData[]
  }

  const account = await getAccount(accountName)

  const prices = await account.execute(
    `
    SELECT price FROM daily_prices
    WHERE assetId = ? AND (timestamp = ? OR ? IS NULL)
    ORDER BY timestamp ASC
  `,
    [assetId, timestamp || null, timestamp || null]
  )

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

export async function fetchDailyPrices(
  accountName: string,
  assetsParam?: Asset[],
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  let assets: Asset[]

  if (!assetsParam) {
    assets = await getAssets(accountName)
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

      if (signal?.aborted) throw new Error(signal.reason)

      const preferredPriceApiId = asset.priceApiId
      const priceApiIds = preferredPriceApiId
        ? [preferredPriceApiId]
        : (Object.keys(PRICE_APIS) as PriceApiId[])

      let since: Timestamp | undefined = await getPriceCursor(accountName, asset.id)
      let until: Timestamp | undefined = today

      if (!since) since = today - 86400000 * (PRICE_API_PAGINATION - 1)

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

            const results = await priceApi({
              limit: PRICE_API_PAGINATION,
              pair,
              since,
              timeInterval: "1d" as ResolutionString,
              until,
            })

            if (!preferredPriceApiId && results.length > 0) {
              patchAsset(accountName, asset.id, { priceApiId })
            }

            if (signal?.aborted) throw new Error(signal.reason)

            if (results.length === 0) {
              throw new Error(`${PRICE_APIS_META[priceApiId].name} EmptyResponse`)
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
      // TODO9 skip assets without coingeckoId
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
