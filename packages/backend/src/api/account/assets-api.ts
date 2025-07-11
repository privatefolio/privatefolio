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
import {
  getAssetContract,
  getAssetPlatform,
  getAssetTicker,
  removePlatformPrefix,
  ZERO_ADDRESS,
} from "src/utils/assets-utils"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { writesAllowed } from "src/utils/environment-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"

import { getCoingeckoCoins } from "../../extensions/metadata/coingecko/coingecko-asset-cache"
import { getAccount } from "../accounts-api"
import { getAccountWithAuditLogs } from "./audit-logs-api"
import { enqueueTask } from "./server-tasks-api"

const getQuery = (whereClause?: string) => sql`
SELECT DISTINCT
 audit_logs.assetId AS audit_log_id,
 assets.*,
 MIN(audit_logs.timestamp) AS firstOwnedAt
FROM
 audit_logs 
LEFT JOIN
 assets ON assets.id = audit_logs.assetId
${whereClause || ""}
GROUP BY audit_logs.assetId`

export async function getMyAssets(
  accountName: string,
  query = getQuery(),
  params?: SqlParam[]
): Promise<MyAsset[]> {
  const account = await getAccountWithAuditLogs(accountName)

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
        firstOwnedAt: row[7],
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as MyAsset
    })

    // try to get the asset from the cache
    const cachedAssets = await getAssets()

    return results.map((result) => {
      let cachedAsset = cachedAssets.find((x) => x.id === result.id)
      const contract = getAssetContract(result.id)
      const platform = getAssetPlatform(result.id)
      const coingeckoId = removePlatformPrefix(platform)
      const ticker = getAssetTicker(result.id)
      // search by ticker
      if (!cachedAsset && !contract && platform) {
        cachedAsset = cachedAssets.find((x) => getAssetTicker(x.id) === ticker)
      }
      // search by coingeckoId (native assets)
      if (!cachedAsset && contract === ZERO_ADDRESS) {
        cachedAsset = cachedAssets.find((x) => x.coingeckoId === coingeckoId)
      }
      if (!cachedAsset && contract === ZERO_ADDRESS && ticker === "ETH") {
        cachedAsset = cachedAssets.find((x) => x.coingeckoId === "ethereum")
      }
      // search by contract
      if (!cachedAsset && contract && coingeckoId) {
        cachedAsset = cachedAssets.find(
          (x) =>
            x.platforms &&
            x.platforms[coingeckoId] &&
            x.platforms[coingeckoId] === contract.toLowerCase()
        )
      }
      // search by symbol
      if (!cachedAsset && ticker) {
        cachedAsset = cachedAssets.find((x) => getAssetTicker(x.id) === ticker)
      }
      return { ...cachedAsset, ...result }
    })
  } catch (error) {
    if (!writesAllowed) return []
    throw new Error(`Failed to query assets: ${error}`)
  }
}

const customAssets: Asset[] = [
  {
    id: `fiat:EUR`,
    logoUrl: `$STATIC_ASSETS/overrides/EUR.png`,
    name: "Euro",
    symbol: "EUR",
  },
]

let assets: Asset[] = []

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
    assets = [...list, ...customAssets]
    list.sort((a, b) => (a.marketCapRank ?? Infinity) - (b.marketCapRank ?? Infinity))
    return list
  } catch {
    return []
  }
}

export async function getAssetsByPlatform(platformId: string): Promise<Asset[]> {
  const assets = await getAssets()
  const coingeckoId = removePlatformPrefix(platformId)
  return assets.filter((asset) => asset.platforms && asset.platforms[coingeckoId])
}

export async function getAsset(accountName: string, id: string): Promise<MyAsset | undefined> {
  const records = await getMyAssets(accountName, getQuery("WHERE audit_logs.assetId = ?"), [id])
  if (records.length === 0) {
    const contract = getAssetContract(id)
    const platform = getAssetPlatform(id)
    const coingeckoId = removePlatformPrefix(platform)

    const cachedAssets = await getAssets()
    return cachedAssets.find((x) => {
      if (x.id === id) return true
      if (x.coingeckoId === id || x.coingeckoId === id.replace("coingecko:", "")) return true
      if (
        x.platforms &&
        x.platforms[coingeckoId] &&
        x.platforms[coingeckoId] === contract?.toLowerCase()
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

    account.eventEmitter.emit(SubscriptionChannel.Metadata)
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

export async function findAssets(
  accountName: string,
  query: string,
  limit = 5,
  strict = false,
  searchSet: "coingecko" | "my-assets" = "coingecko"
): Promise<Asset[]> {
  const normalizedQuery = query.toLowerCase().trim()

  const assets = searchSet === "coingecko" ? await getAssets() : await getMyAssets(accountName)

  if (normalizedQuery === "") {
    return assets.slice(0, limit)
  }

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
      asset.name?.toLowerCase().includes(normalizedQuery) ||
      asset.coingeckoId?.toLowerCase().includes(normalizedQuery)
    ) {
      matchingAssets.push(asset)
    }
  }

  return matchingAssets
}

async function refetchAssets() {
  const data = await getCoingeckoCoins()
  console.log(`Coingecko assets fetched.`)
  await mkdir(`${CACHE_LOCATION}/coins`, { recursive: true })
  await writeFile(`${CACHE_LOCATION}/coins/all.json`, JSON.stringify(data, null, 2))
  assets = []
  return await getAssets()
}

export async function refetchAssetsIfNeeded() {
  console.log(`Coingecko assets checking...`)
  const assets = await getAssets()
  if (assets.length === 0) {
    console.log(`Coingecko assets fetching...`)
    return await refetchAssets()
  }
  console.log(`Coingecko assets already exist: ${assets.length} records.`)
  return assets
}

export function enqueueRefetchAssets(
  accountName: string,
  trigger: TaskTrigger,
  onlyIfNeeded = false
) {
  return enqueueTask(accountName, {
    description: "Refetching assets.",
    function: async (progress) => {
      const assets = await getAssets()
      if (assets.length !== 0 && onlyIfNeeded) {
        await progress([undefined, `Coingecko assets already exist: ${assets.length} records.`])
        return
      }
      const data = await refetchAssets()
      const account = await getAccount(accountName)
      account.eventEmitter.emit(SubscriptionChannel.Metadata)
      await progress([undefined, `Refetched ${data.length} assets from coingecko.com.`])
    },
    name: "Refetch assets",
    priority: TaskPriority.High,
    trigger,
  })
}

export async function subscribeToMetadata(accountName: string, callback: () => void) {
  return createSubscription(accountName, SubscriptionChannel.Metadata, callback)
}

export async function deleteAssetPreferences(accountName: string) {
  const account = await getAccount(accountName)
  await account.execute("DELETE FROM assets")
  account.eventEmitter.emit(SubscriptionChannel.Metadata)
}

export function enqueueDeleteAssetPreferences(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Deleting asset preferences (priceApiId, etc) for all assets.",
    determinate: true,
    function: async () => {
      await deleteAssetPreferences(accountName)
    },
    name: "Delete asset preferences",
    priority: TaskPriority.High,
    trigger,
  })
}
