import { GITHUB_CACHE_URL } from "src/settings/settings"
import {
  getAssetContract,
  getAssetPlatform,
  getAssetTicker,
  isEvmPlatform,
} from "src/utils/assets-utils"

import { CoingeckoAssetPlatform, CoingeckoCoin, CoingeckoExchange } from "./coingecko-interfaces"

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

export async function getCoingeckoAssetPlatforms() {
  const url = `${GITHUB_CACHE_URL}/asset-platforms/all.json`
  const assetPlatformsReq = await fetch(url)
  const data = (await assetPlatformsReq.json()) as CoingeckoAssetPlatform[]
  return data
}

export async function getCoingeckoExchanges() {
  const url = `${GITHUB_CACHE_URL}/exchanges/all.json`
  const exchangesReq = await fetch(url)
  const data = (await exchangesReq.json()) as CoingeckoExchange[]
  return data
}

export async function getCoingeckoCoins() {
  const url = `${GITHUB_CACHE_URL}/coins/all.json`
  const coinsReq = await fetch(url)
  const data = (await coinsReq.json()) as CoingeckoCoin[]
  return data
}
