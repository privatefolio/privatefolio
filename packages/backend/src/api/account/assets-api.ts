import {
  Asset,
  ProgressCallback,
  SqlParam,
  SubscriptionChannel,
  TaskPriority,
  TaskTrigger,
} from "src/interfaces"
import { getAssetTicker } from "src/utils/assets-utils"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { sql } from "src/utils/sql-utils"
import { noop } from "src/utils/utils"

import { getAccount } from "../accounts-api"
import { getCachedAssetMeta } from "../external/assets/coingecko-asset-cache"
import { enqueueTask } from "./server-tasks-api"

export async function getAssetIds(
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

export async function getAssets(
  accountName: string,
  query = getQuery,
  params?: SqlParam[]
): Promise<Asset[]> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
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
      return value as Asset
    })
  } catch (error) {
    throw new Error(`Failed to query assets: ${error}`)
  }
}

export async function getAsset(accountName: string, id: string) {
  const records = await getAssets(accountName, `${getQuery} WHERE audit_logs.assetId = ?`, [id])
  return records[0]
}

export async function upsertAssets(accountName: string, records: Asset[]) {
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

export async function upsertAsset(accountName: string, record: Asset) {
  return upsertAssets(accountName, [record])
}

export async function patchAsset(accountName: string, id: string, patch: Partial<Asset>) {
  const existing = await getAsset(accountName, id)
  const newValue = { ...existing, ...patch }
  await upsertAsset(accountName, newValue)
}

export async function deleteAssetInfos(accountName: string) {
  const account = await getAccount(accountName)
  await account.execute("DELETE FROM assets")
  account.eventEmitter.emit(SubscriptionChannel.AssetMetadata)
}

export function enqueueDeleteAssetInfos(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Deleting info for all assets.",
    determinate: true,
    function: async () => {
      await deleteAssetInfos(accountName)
    },
    name: "Delete asset infos",
    priority: TaskPriority.Low,
    trigger,
  })
}

export async function fetchAssetInfos(
  accountName: string,
  assetIds?: string[],
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  if (!assetIds) {
    throw new Error("No assetIds provided")
  }

  await progress([0, `Fetching asset info for ${assetIds.length} assets`])

  let skipped = 0

  const promises: (() => Promise<void>)[] = []

  for (let i = 1; i <= assetIds.length; i++) {
    const assetId = assetIds[i - 1]

    promises.push(async () => {
      try {
        const meta = await getCachedAssetMeta(assetId)
        await patchAsset(accountName, assetId, meta)
        await progress([undefined, `Fetched ${getAssetTicker(assetId)}`])
      } catch (error) {
        skipped += 1
        await progress([undefined, `Skipped ${getAssetTicker(assetId)}: ${String(error)}`])
      }

      if (signal?.aborted) throw new Error(signal.reason)
    })
  }

  // let progressCount = 0

  await Promise.all(
    promises.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
        // progressCount += 1
        //  progress([(progressCount / assetIds.length) * 100])
      })
    )
  )

  await progress([100, `Fetched ${assetIds.length - skipped} assets, skipped ${skipped} assets`])
}

export function enqueueFetchAssetInfos(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Fetching info for all assets.",
    determinate: true,
    function: async (progress, signal) => {
      await fetchAssetInfos(accountName, await getAssetIds(accountName), progress, signal)
    },
    name: "Fetch asset infos",
    priority: TaskPriority.MediumHigh,
    trigger,
  })
}

export async function subscribeToAssetMetadata(accountName: string, callback: () => void) {
  const account = await getAccount(accountName)
  account.eventEmitter.on(SubscriptionChannel.AssetMetadata, callback)
  return () => account.eventEmitter.off(SubscriptionChannel.AssetMetadata, callback)
}
