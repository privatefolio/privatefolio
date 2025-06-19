import { access, mkdir, readFile, writeFile } from "fs/promises"
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
import { getAssetContract, getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"
import { sleep } from "src/utils/utils"

import { getCoingeckoCoins } from "../../extensions/metadata/coingecko/coingecko-asset-cache"
import { getAccount } from "../accounts-api"
import { enqueueTask } from "./server-tasks-api"

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
          (asset) => getAssetTicker(asset.id) === getAssetTicker(result.id)
        )
      }
      return { ...cachedAsset, ...result }
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
    await access(`${CACHE_LOCATION}/coins/all.json`)
    const data = await readFile(`${CACHE_LOCATION}/coins/all.json`, "utf8")

    const list: MyAsset[] = JSON.parse(data).map(
      (asset: CoingeckoCoin) =>
        ({
          coingeckoId: asset.id,
          id: `coingecko:${asset.id}:${asset.symbol}`,
          logoUrl: asset.image,
          marketCapRank: asset.market_cap_rank,
          name: asset.name,
          platforms: asset.platforms,
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

export async function getAssetsByPlatform(platformId: string): Promise<Asset[]> {
  const assets = await getAssets()
  return assets.filter((asset) => asset.platforms && asset.platforms[platformId])
}

export async function getAsset(accountName: string, id: string): Promise<MyAsset | undefined> {
  const records = await getMyAssets(accountName, `${getQuery} WHERE audit_logs.assetId = ?`, [id])
  if (records.length === 0) {
    const contract = getAssetContract(id)
    const platform = getAssetPlatform(id)

    const cachedAssets = await getAssets()
    return cachedAssets.find((x) => {
      if (x.coingeckoId === id) return true
      if (x.id === id) return true
      if (
        x.platforms &&
        x.platforms[platform] &&
        x.platforms[platform] === contract?.toLowerCase()
      ) {
        return true
      }
      if (x.symbol === id) return true
      return false
    })
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

export async function findAssets(query: string, limit = 5, strict = false): Promise<Asset[]> {
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
      asset.id.toLowerCase() === normalizedQuery ||
      asset.coingeckoId?.toLowerCase() === normalizedQuery ||
      asset.symbol.toLowerCase().includes(normalizedQuery) ||
      (asset.platforms &&
        Object.values(asset.platforms).some(
          (contract) => contract.toLowerCase() === normalizedQuery
        ))
    ) {
      matchingAssets.push(asset)
    }

    if (strict) continue

    if (
      asset.id.toLowerCase().includes(normalizedQuery) ||
      asset.name.toLowerCase().includes(normalizedQuery) ||
      asset.coingeckoId?.toLowerCase().includes(normalizedQuery)
    ) {
      matchingAssets.push(asset)
    }
  }

  return matchingAssets
}

export async function refetchAssets() {
  const data = await getCoingeckoCoins()
  await mkdir(`${CACHE_LOCATION}/coins`, { recursive: true })
  await writeFile(`${CACHE_LOCATION}/coins/all.json`, JSON.stringify(data, null, 2))
  const assets = await getAssets()
  return assets
}

export async function refetchAssetsWithRetry(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await refetchAssets()
    } catch (error) {
      console.error(`Failed to refetch assets: ${String(error)}`)
      if (i === retries - 1) {
        throw new Error(`Failed to refetch assets after ${retries} retries.`)
      }
      await sleep(1000)
    }
  }
}

export function enqueueRefetchAssets(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Refetching assets.",
    function: async (progress) => {
      const data = await refetchAssetsWithRetry()
      const account = await getAccount(accountName)
      account.eventEmitter.emit(SubscriptionChannel.AssetMetadata)
      await progress([undefined, `Refetched ${data.length} coins from coingecko.com.`])
    },
    name: "Refetch assets",
    priority: TaskPriority.High,
    trigger,
  })
}

export async function subscribeToAssetMetadata(accountName: string, callback: () => void) {
  return createSubscription(accountName, SubscriptionChannel.AssetMetadata, callback)
}
