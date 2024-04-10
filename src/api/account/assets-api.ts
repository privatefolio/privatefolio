import { proxy } from "comlink"
import { Asset } from "src/interfaces"
import { AssetMap } from "src/stores/metadata-store"
import { ProgressCallback } from "src/stores/task-store"
import { getAssetTicker } from "src/utils/assets-utils"
import { noop } from "src/utils/utils"

import { defaultDbOptions, getAccount, Pouch } from "../database"
import { validateOperation } from "../database-utils"
import { getCachedAssetMeta } from "../external/assets/coingecko-asset-cache"

export async function updateAsset(accountName: string, id: string, update: Partial<Asset>) {
  const account = getAccount(accountName)

  let newValue: Asset
  try {
    const existing = await account.assetsDB.get(id)
    newValue = { ...existing, ...update }
  } catch (error) {
    newValue = { _id: id, ...update, symbol: getAssetTicker(id) }
  }

  const dbUpdate = await account.assetsDB.put(newValue)
  validateOperation([dbUpdate])
}

export async function fetchAssetInfos(
  accountName: string,
  assetIds?: string[],
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  if (!assetIds) {
    throw new Error("No assetIds provided") // TODO prevent this
  }
  const account = getAccount(accountName)

  progress([0, `Fetching asset info for ${assetIds.length} assets`])

  const promises: (() => Promise<void>)[] = []

  for (let i = 1; i <= assetIds.length; i++) {
    const assetId = assetIds[i - 1]

    // eslint-disable-next-line no-loop-func
    promises.push(async () => {
      try {
        const meta = await getCachedAssetMeta(assetId)

        const _rev = await account.assetsDB
          .get(assetId)
          .then((x) => x._rev)
          .catch(() => undefined)

        const update = await account.assetsDB.put({
          _id: assetId,
          _rev,
          ...meta,
        })
        validateOperation([update])

        progress([undefined, `Fetched ${getAssetTicker(assetId)}`])
      } catch (error) {
        progress([undefined, `Skipped ${getAssetTicker(assetId)}: ${error}`])
      }
    })
  }

  let progressCount = 0

  // for (const promise of promises) {
  //   if (signal?.aborted) {
  //     throw new Error(signal.reason)
  //   }

  //   await promise()
  //   progressCount += 1
  //   progress([(progressCount / assetIds.length) * 100])
  // }

  await Promise.all(
    promises.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
        progressCount += 1
        progress([(progressCount / assetIds.length) * 100])
      })
    )
  )
}

export async function getAssetMap(accountName: string, assetIds?: string[]) {
  const map: AssetMap = {}

  if (!assetIds || assetIds.length === 0) {
    return map
  }

  const account = getAccount(accountName)

  const docsWithIds = assetIds.map((x) => ({ id: x }))
  const { results } = await account.assetsDB.bulkGet({ docs: docsWithIds })

  for (const result of results) {
    if ("ok" in result.docs[0]) {
      const asset = result.docs[0].ok
      map[asset._id] = asset
    }
  }

  return map
}

export async function deleteAssetInfos(accountName: string) {
  const account = getAccount(accountName)
  await account.assetsDB.destroy()

  account.assetsDB = new Pouch<Asset>(`${accountName}/assets`, defaultDbOptions)
}

export function subscribeToAssets(callback: () => void, accountName: string) {
  const account = getAccount(accountName)
  const changesSub = account.assetsDB
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
