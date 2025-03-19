import { AssetMetadata, CoinData } from "src/interfaces"
import { GITHUB_CACHE_URL } from "src/settings"
import {
  getAssetContract,
  getAssetPlatform,
  getAssetTicker,
  isEvmPlatform,
} from "src/utils/assets-utils"

import { memoryCacheMap } from "./coingecko-asset-memory-cache"

export async function getCachedCoingeckoId(assetId: string): Promise<string> {
  try {
    let url: string

    const platform = getAssetPlatform(assetId)
    if (isEvmPlatform(platform)) {
      const contract = getAssetContract(assetId)
      url = `${GITHUB_CACHE_URL}/coin-id/a/${platform}/${contract.toLowerCase()}`
    } else {
      const ticker = getAssetTicker(assetId)
      url = `${GITHUB_CACHE_URL}/coin-id/s/${ticker.toLowerCase()}`
    }

    const geckoIdReq = await fetch(url)
    const coingeckoId = (await geckoIdReq.text()) as string

    if (coingeckoId === "404: Not Found") throw new Error(`Failed to get coingecko id`)

    return coingeckoId
  } catch (error) {
    throw new Error(`Failed to get coingecko id`)
  }
}

export async function getCachedAssetMeta(assetId: string): Promise<AssetMetadata> {
  if (memoryCacheMap[assetId]) {
    return memoryCacheMap[assetId]
  }

  const coingeckoId = await getCachedCoingeckoId(assetId)
  const ticker = getAssetTicker(assetId)
  const url = `${GITHUB_CACHE_URL}/coin-data/${coingeckoId}`

  const geckoMetaReq = await fetch(url)
  const data = (await geckoMetaReq.json()) as CoinData

  return {
    coingeckoId,
    logoUrl: data.image,
    name: data.name,
    symbol: ticker,
  }
}
