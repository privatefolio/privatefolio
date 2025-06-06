import { mkdir, readFile, writeFile } from "fs/promises"
import { CoingeckoCoin } from "src/extensions/metadata/coingecko/coingecko-interfaces"
import {
  Asset,
  MyAsset,
  SqlParam,
  SubscriptionChannel,
  TaskPriority,
  TaskTrigger,
} from "src/interfaces"
import { CACHE_LOCATION } from "src/settings/settings"
import { getAssetTicker } from "src/utils/assets-utils"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"

import { getCoingeckoCoins } from "../../extensions/metadata/coingecko/coingecko-asset-cache"
import { getAccount } from "../accounts-api"
import { enqueueTask } from "./server-tasks-api"

export async function getMyAssetIds(
  accountName: string,
  query = "SELECT DISTINCT assetId FROM audit_logs",
  params?: SqlParam[]
): Promise<string[]> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      return row[0] as string
    })
  } catch (error) {
    throw new Error(`Failed to query assets: ${error}`)
  }
}

const getQuery = sql`
SELECT DISTINCT
 audit_logs.assetId AS audit_log_id,
 assets.* 
FROM
 audit_logs 
LEFT JOIN
 assets ON assets.id = audit_logs.assetId`

export async function getMyAssets(
  accountName: string,
  query = getQuery,
  params?: SqlParam[]
): Promise<MyAsset[]> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    const results = result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        symbol: getAssetTicker(row[0] as string),
        name: row[3],
        logoUrl: row[4],
        priceApiId: row[5],
        coingeckoId: row[6],
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as MyAsset
    })

    // try to get the asset from the cache
    const cachedAssets = await getAssets()

    return results.map((result) => {
      let cachedAsset = cachedAssets.find((asset) => asset.id === result.id)
      if (!cachedAsset) {
        cachedAsset = cachedAssets.find(
          (asset) => getAssetTicker(asset.symbol) === getAssetTicker(result.symbol)
        )
      }
      return { ...result, ...cachedAsset }
    })
  } catch (error) {
    throw new Error(`Failed to query assets: ${error}`)
  }
}

const assets: Asset[] = []

export async function getAssets(): Promise<Asset[]> {
  if (assets.length > 0) {
    return assets
  }

  try {
    const data = await readFile(`${CACHE_LOCATION}/coins/all.json`, "utf8")

    const list: MyAsset[] = JSON.parse(data).map(
      (asset: CoingeckoCoin) =>
        ({
          coingeckoId: asset.id,
          id: `coingecko:${asset.id}:${asset.symbol}`,
          logoUrl: asset.image,
          marketCapRank: asset.market_cap_rank,
          name: asset.name,
          symbol: asset.symbol,
        }) as Asset
    )
    list.sort((a, b) => (a.marketCapRank ?? Infinity) - (b.marketCapRank ?? Infinity))
    return list
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function getAsset(accountName: string, id: string): Promise<MyAsset | undefined> {
  const records = await getMyAssets(accountName, `${getQuery} WHERE audit_logs.assetId = ?`, [id])
  if (records.length === 0) {
    const cachedAssets = await getAssets()
    return cachedAssets.find((asset) => asset.id === id)
  }
  return records[0]
}

export async function upsertAssets(accountName: string, records: MyAsset[]) {
  const account = await getAccount(accountName)

  try {
    await account.executeMany(
      `INSERT OR REPLACE INTO assets (
        id, symbol, name, logoUrl, priceApiId, coingeckoId
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      records.map((record) => [
        record.id,
        getAssetTicker(record.id),
        record.name || null,
        record.logoUrl || null,
        record.priceApiId || null,
        record.coingeckoId || null,
      ])
    )

    account.eventEmitter.emit(SubscriptionChannel.AssetMetadata)
  } catch (error) {
    throw new Error(`Failed to add or replace assets: ${error}`)
  }
}

export async function upsertAsset(accountName: string, record: MyAsset) {
  return upsertAssets(accountName, [record])
}

export async function patchAsset(accountName: string, id: string, patch: Partial<MyAsset>) {
  const existing = await getAsset(accountName, id)
  const newValue = { ...existing, ...patch }
  await upsertAsset(accountName, newValue)
}

export async function findAssets(query: string, limit = 5): Promise<Asset[]> {
  const normalizedQuery = query.toLowerCase().trim()

  if (!normalizedQuery) {
    return []
  }

  const assets = await getAssets()
  const matchingAssets: Asset[] = []

  for (const asset of assets) {
    if (matchingAssets.length >= limit) {
      break
    }

    if (
      asset.name.toLowerCase().includes(normalizedQuery) ||
      asset.id.toLowerCase().includes(normalizedQuery) ||
      asset.symbol.toLowerCase().includes(normalizedQuery)
    ) {
      matchingAssets.push(asset)
    }
  }

  return matchingAssets
}

// async function fetchAssetInfos(
//   accountName: string,
//   assetIds?: string[],
//   progress: ProgressCallback = noop,
//   signal?: AbortSignal
// ) {
//   if (!assetIds) {
//     throw new Error("No assetIds provided")
//   }

//   await progress([0, `Fetching asset info for ${assetIds.length} assets`])

//   let skipped = 0

//   const promises: (() => Promise<void>)[] = []

//   for (let i = 1; i <= assetIds.length; i++) {
//     const assetId = assetIds[i - 1]

//     promises.push(async () => {
//       try {
//         const meta = await getCachedAssetMeta(assetId)
//         await patchAsset(accountName, assetId, meta)
//         await progress([undefined, `Fetched ${getAssetTicker(assetId)}`])
//       } catch (error) {
//         skipped += 1
//         await progress([undefined, `Skipped ${getAssetTicker(assetId)}: ${String(error)}`])
//       }

//       if (signal?.aborted) throw new Error(signal.reason)
//     })
//   }

//   // let progressCount = 0

//   await Promise.all(
//     promises.map((fetchFn) =>
//       fetchFn().then(() => {
//         if (signal?.aborted) {
//           throw new Error(signal.reason)
//         }
//         // progressCount += 1
//         //  progress([(progressCount / assetIds.length) * 100])
//       })
//     )
//   )

//   await progress([100, `Fetched ${assetIds.length - skipped} assets, skipped ${skipped} assets`])
// }

export function enqueueRefetchAssets(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Refetching assets.",
    // determinate: true,
    function: async (progress) => {
      const data = await getCoingeckoCoins()
      await mkdir(`${CACHE_LOCATION}/coins`, { recursive: true })
      await writeFile(`${CACHE_LOCATION}/coins/all.json`, JSON.stringify(data, null, 2))
      await progress([undefined, `Refetched ${data.length} coins`])
    },
    name: "Refetch assets",
    priority: TaskPriority.MediumHigh,
    trigger,
  })
}

export async function subscribeToAssetMetadata(accountName: string, callback: () => void) {
  return createSubscription(accountName, SubscriptionChannel.AssetMetadata, callback)
}
