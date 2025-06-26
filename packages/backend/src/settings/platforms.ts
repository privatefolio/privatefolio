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

/**
 * RPC providers for different EVM chains.
 * Ordered by preference/reliability based on DefiLlama chainlist and other sources.
 * https://chainlist.org/
 */
export const RPC_PROVIDERS: Record<number, string[]> = {
  // Ethereum Mainnet (chainId: 1)
  1: [
    "https://ethereum-rpc.publicnode.com",
    "https://eth.llamarpc.com",
    "https://1rpc.io/eth",
    "https://ethereum.blockpi.network/v1/rpc/public",
    "https://eth-mainnet.public.blastapi.io",
    "https://eth-mainnet.g.alchemy.com/v2/demo",
    "https://cloudflare-eth.com",
    "https://eth.drpc.org",
  ],
  // Optimism (chainId: 10)
  10: [
    "https://optimism-rpc.publicnode.com",
    "https://optimism.llamarpc.com",
    "https://1rpc.io/op",
    "https://optimism.blockpi.network/v1/rpc/public",
    "https://optimism-mainnet.public.blastapi.io",
    "https://opt-mainnet.g.alchemy.com/v2/demo",
  ],
  // Polygon (chainId: 137)
  137: [
    "https://polygon-rpc.com",
    "https://polygon.llamarpc.com",
    "https://1rpc.io/matic",
    "https://polygon.blockpi.network/v1/rpc/public",
    "https://polygon-mainnet.public.blastapi.io",
    "https://polygon-mainnet.g.alchemy.com/v2/demo",
  ],
  // Arbitrum One (chainId: 42161)
  42161: [
    "https://arbitrum-one-rpc.publicnode.com",
    "https://arbitrum.llamarpc.com",
    "https://1rpc.io/arb",
    "https://arbitrum.blockpi.network/v1/rpc/public",
    "https://arbitrum-mainnet.public.blastapi.io",
    "https://arb-mainnet.g.alchemy.com/v2/demo",
  ],
  // Binance Smart Chain (chainId: 56)
  56: [
    "https://bsc-rpc.publicnode.com",
    "https://binance.llamarpc.com",
    "https://1rpc.io/bnb",
    "https://bsc.blockpi.network/v1/rpc/public",
    "https://bsc-mainnet.public.blastapi.io",
    "https://bsc-dataseed1.binance.org",
  ],
  // Base (chainId: 8453)
  8453: [
    "https://base-rpc.publicnode.com",
    "https://base.llamarpc.com",
    "https://1rpc.io/base",
    "https://base.blockpi.network/v1/rpc/public",
    "https://base-mainnet.public.blastapi.io",
    "https://base-mainnet.g.alchemy.com/v2/demo",
  ],
}
