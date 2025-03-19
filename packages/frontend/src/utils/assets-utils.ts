import { Networkish } from "ethers"
import { PlatformId, Web3Address } from "src/interfaces"

import { memoize } from "./fp-utils"

/**
 * Returns the ticker of an asset
 */
export const getAssetTicker = memoize(function getAssetTicker(assetId?: string) {
  if (assetId === undefined) return "-"

  let ticker: string

  const parts = assetId.split(":")
  if (parts.length === 1) {
    ticker = parts[0]
  } else if (parts.length === 2) {
    ticker = parts[1]
  } else {
    ticker = parts[2]
  }

  return ticker.toUpperCase()
})

export const getAssetPlatform = memoize(function getAssetPlatform(assetId: string) {
  if (!assetId.includes(":")) return ""
  return assetId.split(":")[0] as PlatformId
})

export const getAssetContract = memoize(function getAssetPlatform(assetId: string) {
  return assetId.split(":")[1] as Web3Address
})

export const getEvmChainId = memoize(function getAssetPlatform(platform: PlatformId) {
  if (platform === "ethereum") return 1
  return Number(platform.split("-")[1]) as Networkish
})

export const isEvmPlatform = memoize(function isEvmPlatform(platform: PlatformId) {
  return platform === "ethereum" || platform.includes("eip155")
})
