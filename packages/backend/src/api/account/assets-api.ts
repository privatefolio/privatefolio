import { access, mkdir, readFile, writeFile } from "fs/promises"
import { CoingeckoCoin } from "src/extensions/metadata/coingecko/coingecko-interfaces"
import {
  Asset,
  MyAsset,
  ProgressCallback,
  SecTicker,
  SqlParam,
  SubscriptionChannel,
  TaskPriority,
  TaskTrigger,
} from "src/interfaces"
import { CACHE_LOCATION } from "src/settings/settings"
import {
  getAssetInternalId,
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
import { getSecTickers, US_SEC_PLATFORM } from "../../extensions/metadata/us-sec-api"
import { getAccount } from "../accounts-api"
import { getAccountWithAuditLogs } from "./audit-logs-api"
import { getValue, setValue } from "./kv-api"
import { enqueueTask } from "./server-tasks-api"

const SCHEMA_VERSION = 3

export async function getAccountWithAssets(accountName: string) {
  const account = await getAccount(accountName)
  if (!writesAllowed) return account

  const schemaVersion = await getValue<number>(accountName, `assets_schema_version`, 0)
  if (schemaVersion < 1) {
    await account.execute(sql`
      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR PRIMARY KEY,
        symbol VARCHAR NOT NULL,
        name VARCHAR,
        logoUrl VARCHAR,
        priceApiId VARCHAR,
        coingeckoId VARCHAR,
        favorite BOOLEAN
      );`)
  }
  if (schemaVersion < 3) {
    try {
      const columns = await account.execute(`PRAGMA table_info(assets);`)
      const hasFavorite = Array.isArray(columns) && columns.some((row) => row[1] === "favorite")
      if (!hasFavorite) {
        await account.execute(sql`
        ALTER TABLE assets ADD COLUMN favorite BOOLEAN;
      `)
      }
    } catch {}

    await account.execute(sql`DROP VIEW IF EXISTS favorite_assets`)
    await account.execute(sql`
      CREATE VIEW favorite_assets AS
      SELECT * FROM assets WHERE favorite = true;`)
  }
  if (schemaVersion !== SCHEMA_VERSION) {
    await setValue(accountName, `assets_schema_version`, SCHEMA_VERSION)
  }

  return account
}

const getQuery = (singleAsset?: boolean) => sql`
SELECT id, name, symbol, logoUrl, priceApiId, coingeckoId, favorite, MAX(firstOwnedAt) FROM (
  SELECT DISTINCT
    audit_logs.assetId AS id,
    assets.*,
    MIN(audit_logs.timestamp) AS firstOwnedAt
  FROM
    audit_logs
  LEFT JOIN
    assets ON assets.id = audit_logs.assetId
  ${singleAsset ? `WHERE audit_logs.assetId = ?` : ""}
  GROUP BY audit_logs.assetId

  UNION

  SELECT
    favorite_assets.id AS id,
    favorite_assets.*,
    NULL AS firstOwnedAt
  FROM
    favorite_assets
  ${singleAsset ? `WHERE favorite_assets.id = ?` : ""}
) AS combined
GROUP BY id
`

export async function getMyAssets(
  accountName: string,
  query = getQuery(),
  params?: SqlParam[]
): Promise<MyAsset[]> {
  await getAccountWithAuditLogs(accountName)
  const account = await getAccountWithAssets(accountName)

  try {
    const result = await account.execute(query, params)
    const results = result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        name: row[1],
        symbol: getAssetTicker(row[0] as string),
        logoUrl: row[3],
        priceApiId: row[4],
        coingeckoId: row[5],
        favorite: row[6] ? Boolean(row[6]) : null,
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
      const contract = getAssetInternalId(result.id)
      const platform = getAssetPlatform(result.id)
      const coingeckoId = removePlatformPrefix(platform)
      const ticker = getAssetTicker(result.id)
      // search by ticker
      if (!cachedAsset && !contract && platform) {
        cachedAsset = cachedAssets.find((x) => getAssetTicker(x.id) === ticker)
      }
      // search by coingeckoId (native assets)
      if (!cachedAsset && contract === ZERO_ADDRESS && ticker === "ETH") {
        cachedAsset = cachedAssets.find((x) => x.coingeckoId === "ethereum")
      }
      if (!cachedAsset && contract === ZERO_ADDRESS && ticker === "MATIC") {
        cachedAsset = cachedAssets.find((x) => x.coingeckoId === "polygon")
      }
      if (!cachedAsset && contract === ZERO_ADDRESS) {
        cachedAsset = cachedAssets.find((x) => x.coingeckoId === coingeckoId)
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
      if (!cachedAsset && ticker && !contract) {
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

async function getCoinsFromCache() {
  try {
    await access(`${CACHE_LOCATION}/coins/all.json`)
    const data = await readFile(`${CACHE_LOCATION}/coins/all.json`, "utf8")
    const parsed = JSON.parse(data) as CoingeckoCoin[]
    const list: Asset[] = parsed.map(
      ({ id, image: logoUrl, market_cap_rank: marketCapRank, name, platforms, symbol }) =>
        ({
          coingeckoId: id,
          id: `coingecko:${id}:${symbol}`,
          logoUrl,
          marketCapRank,
          name,
          platforms,
          symbol,
        }) satisfies Asset
    )

    return list
  } catch {
    return []
  }
}

async function getStocksFromCache() {
  try {
    await access(`${CACHE_LOCATION}/stocks/all.json`)
    const data = await readFile(`${CACHE_LOCATION}/stocks/all.json`, "utf8")
    const parsed = JSON.parse(data) as Record<string, SecTicker>

    const list: Asset[] = Object.entries(parsed).map(
      ([key, { cik_str: secId, ticker, title: name }]) =>
        ({
          id: `${US_SEC_PLATFORM.id}:${secId}:${ticker.toLowerCase()}`,
          logoUrl: `https://github.com/nvstly/icons/raw/main/ticker_icons/${ticker}.png`,
          // logoUrl: `https://github.com/davidepalazzo/ticker-logos/raw/main/ticker_icons/${symbol}.png`,
          marketCapRank: Number(key) + 1,
          name,
          symbol: ticker.toLowerCase(),
        }) satisfies Asset
    )

    return list
  } catch {
    return []
  }
}

export async function getAssets(): Promise<Asset[]> {
  if (assets.length > 0) {
    return assets
  }

  const coinAssets = await getCoinsFromCache()
  const stockAssets = await getStocksFromCache()

  const list: Asset[] = [...coinAssets, ...stockAssets, ...customAssets]

  list.sort((a, b) => {
    // Primary sort: market cap rank ascending (nulls/undefined last)
    const aRank = a.marketCapRank ?? Infinity
    const bRank = b.marketCapRank ?? Infinity
    if (aRank !== bRank) return aRank - bRank

    // Secondary sort: name or symbol ascending
    const aName = a.name ?? a.symbol
    const bName = b.name ?? b.symbol
    return aName.localeCompare(bName)
  })

  assets = list
  return assets
}

export async function getAssetsByPlatform(platformId: string): Promise<Asset[]> {
  const assets = await getAssets()
  const coingeckoId = removePlatformPrefix(platformId)
  return assets.filter((asset) => asset.platforms && asset.platforms[coingeckoId])
}

export async function getAsset(accountName: string, id: string): Promise<MyAsset | undefined> {
  const records = await getMyAssets(accountName, getQuery(true), [id, id])
  if (records.length === 0) {
    const contract = getAssetInternalId(id)
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
  const account = await getAccountWithAssets(accountName)

  try {
    await account.executeMany(
      `INSERT OR REPLACE INTO assets (
        id, symbol, name, logoUrl, priceApiId, coingeckoId, favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      records.map((record) => [
        record.id,
        getAssetTicker(record.id),
        record.name || null,
        record.logoUrl || null,
        record.priceApiId || null,
        record.coingeckoId || null,
        typeof record.favorite === "boolean" ? record.favorite : null,
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
  searchSet: "all-assets" | "my-assets" = "all-assets"
): Promise<Asset[]> {
  const normalizedQuery = query.toLowerCase().trim()

  const assets = searchSet === "all-assets" ? await getAssets() : await getMyAssets(accountName)

  if (!normalizedQuery) {
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

async function refetchCoins() {
  const coins = await getCoingeckoCoins()
  await mkdir(`${CACHE_LOCATION}/coins`, { recursive: true })
  await writeFile(`${CACHE_LOCATION}/coins/all.json`, JSON.stringify(coins, null, 2))
  return coins
}

async function refetchStocks() {
  const stocks = await getSecTickers()
  await mkdir(`${CACHE_LOCATION}/stocks`, { recursive: true })
  await writeFile(`${CACHE_LOCATION}/stocks/all.json`, JSON.stringify(stocks, null, 2))
  return stocks
}

async function refetchAssets(progress?: ProgressCallback) {
  await progress?.([undefined, `Downloading metadata for coins`])
  const coins = await refetchCoins()
  await progress?.([50, `Downloaded metadata for ${coins.length} coins`])
  await progress?.([undefined, `Downloading metadata for stocks`])
  const stocks = await refetchStocks()
  await progress?.([100, `Downloaded metadata for ${Object.keys(stocks).length} stocks`])
  assets = []
  return await getAssets()
}

export async function refetchAssetsIfNeeded() {
  console.log(`Assets checking...`)
  const assets = await getAssets()
  if (assets.length === customAssets.length) {
    console.log(`Assets fetching...`)
    return await refetchAssets()
  }
  console.log(`Assets already exist: ${assets.length} records.`)
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
      if (assets.length > customAssets.length && onlyIfNeeded) {
        await progress([undefined, `Assets already exist: ${assets.length} records.`])
        return
      }
      const data = await refetchAssets(progress)
      const account = await getAccountWithAssets(accountName)
      account.eventEmitter.emit(SubscriptionChannel.Metadata)
      await progress([undefined, `Downloaded metadata for ${data.length} assets.`])
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
  const account = await getAccountWithAssets(accountName)
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
