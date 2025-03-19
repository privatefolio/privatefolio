import { getAddress, Networkish } from "ethers"
import { PlatformId, Web3Address } from "src/interfaces"

import { memoize } from "./fp-utils"

/**
 * Returns the ticker of an asset
 */
export const getAssetTicker = memoize(function getAssetTicker(assetId?: string) {
  if (assetId === undefined) return "-"

  const parts = assetId.split(":")
  if (parts.length === 2) return parts[1]
  return parts[2]
})

export const getAssetPlatform = memoize(function getAssetPlatform(assetId: string) {
  return assetId.split(":")[0] as PlatformId
})

export const getAssetContract = memoize(function getAssetPlatform(assetId: string) {
  const contractAddress = assetId.split(":")[1]
  return formatAddress(contractAddress) as Web3Address
})

export const getEvmChainId = memoize(function getAssetPlatform(platform: PlatformId) {
  if (platform === "ethereum") return 1
  return Number(platform.split("-")[1]) as Networkish
})

export const isEvmPlatform = memoize(function isEvmPlatform(platform: PlatformId) {
  return platform === "ethereum" || platform.includes("eip155")
})

export const formatAddress = (address: string) => {
  try {
    return getAddress(address.toLowerCase())
  } catch {
    return address
  }
}
