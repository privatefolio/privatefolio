import { PlatformMeta } from "src/interfaces"

export const WETH_ASSET_ID = "ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2:WETH"

export const PLATFORMS_META: Record<string, PlatformMeta> = {
  "arbitrum-one": {
    blockExplorer: {
      name: "ArbiScan",
      url: "https://arbiscan.io",
    },
    nativeAssetId: "arbitrum-one:0x0000000000000000000000000000000000000000:ETH",
  },
  base: {
    blockExplorer: {
      name: "BaseScan",
      url: "https://basescan.org",
    },
    nativeAssetId: "base:0x0000000000000000000000000000000000000000:ETH",
  },
  ethereum: {
    blockExplorer: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
    nativeAssetId: "ethereum:0x0000000000000000000000000000000000000000:ETH",
  },
  "optimistic-ethereum": {
    nativeAssetId: "optimistic-ethereum:0x0000000000000000000000000000000000000000:ETH",
  },
  "polygon-pos": {
    blockExplorer: {
      name: "PolygonScan",
      url: "https://polygonscan.com",
    },
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
