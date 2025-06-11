import { PlatformMeta } from "src/interfaces"

export const WETH_ASSET_ID = "ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2:WETH"
export const WBTC_ASSET_ID = "ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC"

export const PLATFORMS_META: Record<string, PlatformMeta> = {
  "arbitrum-one": {
    blockExplorer: {
      name: "ArbiScan",
      url: "https://arbiscan.io",
    },
    chainId: 42161,
    nativeAssetId: "arbitrum-one:0x0000000000000000000000000000000000000000:ETH",
  },
  base: {
    blockExplorer: {
      name: "BaseScan",
      url: "https://basescan.org",
    },
    chainId: 8453,
    nativeAssetId: "base:0x0000000000000000000000000000000000000000:ETH",
  },
  "binance-smart-chain": {
    blockExplorer: {
      name: "BSCScan",
      url: "https://bscscan.com",
    },
    chainId: 56,
  },
  ethereum: {
    blockExplorer: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
    chainId: 1,
    nativeAssetId: "ethereum:0x0000000000000000000000000000000000000000:ETH",
  },
  "optimistic-ethereum": {
    blockExplorer: {
      name: "Optimistic Etherscan",
      url: "https://optimistic.etherscan.io",
    },
    chainId: 10,
    nativeAssetId: "optimistic-ethereum:0x0000000000000000000000000000000000000000:ETH",
  },
  "polygon-pos": {
    blockExplorer: {
      name: "PolygonScan",
      url: "https://polygonscan.com",
    },
    chainId: 137,
    nativeAssetId: "polygon-pos:0x0000000000000000000000000000000000000000:MATIC",
  },
}

export function getBlockExplorerUrl(platformId: string, addr: string, type: string) {
  if (!(platformId in PLATFORMS_META)) {
    return ""
  }

  const { blockExplorer } = PLATFORMS_META[platformId]
  if (!blockExplorer) return ""

  return `${blockExplorer.url}/${type}/${addr}`
}

export function getBlockExplorerName(platformId: string) {
  if (!(platformId in PLATFORMS_META)) {
    return ""
  }

  const { blockExplorer } = PLATFORMS_META[platformId]
  if (!blockExplorer) return ""

  return blockExplorer.name
}
