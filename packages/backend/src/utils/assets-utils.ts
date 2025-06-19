import { getAddress } from "ethers"
import { Web3Address } from "src/interfaces"

import { PLATFORMS_META } from "../settings/platforms"
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

  return formatTicker(ticker)
})

export function formatTicker(ticker?: string) {
  if (!ticker) return "-"
  return ticker.toUpperCase()
}

export const getAssetPlatform = memoize(function getAssetPlatform(assetId: string) {
  try {
    return assetId.split(":")[0]
  } catch {}
})

export const getAssetContract = memoize(function getAssetContract(assetId: string) {
  try {
    const contractAddress = assetId.split(":")[1]
    return formatAddress(contractAddress) as Web3Address
  } catch {}
})

export const isEvmPlatform = memoize(function isEvmPlatform(platformId: string) {
  if (!PLATFORMS_META[platformId]) return false
  return PLATFORMS_META[platformId].chainId !== undefined
})

export const formatAddress = (address: string) => {
  try {
    return getAddress(address.toLowerCase())
  } catch {
    return address
  }
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export function isNativeAsset(contractAddress: string) {
  return contractAddress === ZERO_ADDRESS
}
