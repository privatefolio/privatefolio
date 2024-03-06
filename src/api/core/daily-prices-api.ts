import { proxy } from "comlink"
import { ChartData, ResolutionString, SavedPrice, Time, Timestamp } from "src/interfaces"
import { PRICE_API_PAGINATION } from "src/settings"
import { ProgressCallback } from "src/stores/task-store"
import { getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"
import { formatDate } from "src/utils/formatting-utils"
import { noop } from "src/utils/utils"

import { core } from "../database"
import { validateOperation } from "../database-utils"
import { PAIR_MAPPER, PRICE_APIS, PRICE_MAPPER } from "./prices/providers"

export async function indexDailyPrices() {
  await core.dailyPricesDB.createIndex({
    index: {
      fields: ["timestamp"],
      name: "timestamp",
    },
  })
  await core.dailyPricesDB.createIndex({
    index: {
      fields: ["assetId", "timestamp"],
      name: "assetId",
    },
  })
}

export async function getPricesForAsset(assetId: string, timestamp?: Timestamp) {
  if (assetId === "USDT" && !!timestamp) {
    return [{ time: timestamp / 1000, value: 1 }] as ChartData[]
  }

  await indexDailyPrices()

  const _req: PouchDB.Find.FindRequest<SavedPrice> = {
    selector: {
      assetId,
      timestamp: timestamp || { $exists: true },
    },
    sort: [
      {
        //
        assetId: "asc",
        // eslint-disable-next-line sort-keys-fix/sort-keys-fix
        timestamp: "asc",
      },
    ],
  }

  // console.log("📜 LOG > findTransactions > _req:", _req)
  // const explain = await (core.dailyPricesDB as any).explain(_req)
  // console.log("📜 LOG > findTransactions > explain:", explain.index)

  const prices = await core.dailyPricesDB.find(_req)

  return prices.docs.map((x) => x.price)
}

export async function getAssetPriceMap(timestamp: Timestamp) {
  await indexDailyPrices()

  const day: Timestamp = timestamp - (timestamp % 86400000)

  const _req: PouchDB.Find.FindRequest<SavedPrice> = {
    fields: ["assetId", "price", "source"],
    selector: { timestamp: day },
  }

  // console.log("📜 LOG > findTransactions > _req:", _req)
  // const explain = await (core.dailyPricesDB as any).explain(_req)
  // console.log("📜 LOG > findTransactions > explain:", explain.index)

  const prices = await core.dailyPricesDB.find(_req)

  return prices.docs.reduce(
    (map, x) => {
      map[x.assetId] = x.price
      return map
    },
    {
      USDT: { time: (day / 1000) as Time, value: 1 },
    } as Record<string, ChartData>
  )
}

export async function getPriceCursor(assetId: string): Promise<Timestamp | undefined> {
  const prices = await core.dailyPricesDB.find({
    limit: 1,
    selector: {
      assetId,
      timestamp: { $exists: true },
    },
    sort: [
      {
        assetId: "desc",
        timestamp: "desc",
      },
    ],
  })

  if (prices.docs.length === 0) {
    return undefined
  }

  return prices.docs[0].timestamp
}

type FetchDailyPricesRequest = {
  assetIds?: string[]
}

export async function fetchDailyPrices(
  request: FetchDailyPricesRequest,
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  const { assetIds } = request

  if (!assetIds) {
    throw new Error("No assetIds provided") // TODO prevent this
  }

  progress([0, `Fetching asset prices for ${assetIds.length} assets`])
  await indexDailyPrices()

  const now = Date.now()
  const today: Timestamp = now - (now % 86400000)

  const promises: (() => Promise<void>)[] = []

  for (let i = 1; i <= assetIds.length; i++) {
    // eslint-disable-next-line no-loop-func
    promises.push(async () => {
      const assetId = assetIds[i - 1]

      if (signal?.aborted) {
        throw new Error(signal.reason)
      }

      const platformId = getAssetPlatform(assetId)

      const priceApi = PRICE_APIS[platformId]
      const priceMapper = PRICE_MAPPER[platformId]
      const pairMapper = PAIR_MAPPER[platformId]

      if (!priceApi || !priceMapper || !pairMapper) {
        throw new Error(`Price API "${platformId}" is not supported`)
      }

      try {
        let since: Timestamp | undefined = await getPriceCursor(assetId)
        let until: Timestamp | undefined = today

        if (!since) since = today - 86400000 * PRICE_API_PAGINATION

        while (true) {
          const pair = pairMapper(assetId)

          const results = await priceApi({
            limit: PRICE_API_PAGINATION,
            pair,
            since,
            timeInterval: "1d" as ResolutionString,
            until,
          })

          if (results.length === 0) {
            progress([undefined, `Skipped ${getAssetTicker(assetId)}: no results`])
            break
          }

          const docIds: Array<{ id: string }> = []

          const documentMap = results.reduce((acc, result) => {
            const price = priceMapper(result)
            const timestamp = (price.time as number) * 1000
            const _id = `${assetId}-${timestamp}`

            acc[_id] = {
              _id,
              assetId,
              pair,
              price,
              timestamp,
            }

            docIds.push({ id: _id })
            return acc
          }, {} as Record<string, SavedPrice>)

          const { results: docsWithRevision } = await core.dailyPricesDB.bulkGet({ docs: docIds })

          const docs: SavedPrice[] = docsWithRevision.map((x) => ({
            ...documentMap[x.id],
            _rev: "ok" in x.docs[0] ? x.docs[0].ok._rev : undefined,
          }))

          const updates = await core.dailyPricesDB.bulkDocs(docs)
          validateOperation(updates)

          const start = (priceMapper(results[0]).time as number) * 1000
          const end = (priceMapper(results[results.length - 1]).time as number) * 1000

          progress([
            undefined,
            `Fetched ${getAssetTicker(assetId)} from ${formatDate(start)} to ${formatDate(end)}`,
          ])

          if (results.length !== PRICE_API_PAGINATION) {
            // reached listing date (genesis)
            break
          }

          until = start - 86400000
          since = start - 86400000 * PRICE_API_PAGINATION
        }
      } catch (error) {
        progress([undefined, `Skipped ${getAssetTicker(assetId)}: ${error}`])
      }
    })
  }

  let progressCount = 0

  await Promise.all(
    promises.map((fetchFn) =>
      fetchFn().then(() => {
        progressCount += 1
        progress([(progressCount / assetIds.length) * 100])
      })
    )
  )
}

export function subscribeToDailyPrices(callback: () => void) {
  const changesSub = core.dailyPricesDB
    .changes({
      live: true,
      since: "now",
    })
    .on("change", callback)

  return proxy(() => {
    try {
      changesSub.cancel()
    } catch {}
  })
}
