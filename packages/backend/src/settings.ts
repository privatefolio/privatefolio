import { isNode } from "./utils/environment-utils"

const DEFAULT_DATA_LOCATION = "./data"
const DATA_LOCATION =
  isNode && process.env.DATA_LOCATION ? process.env.DATA_LOCATION : DEFAULT_DATA_LOCATION

export const DATABASES_LOCATION = `${DATA_LOCATION}/databases`
export const LOGS_LOCATION = `${DATA_LOCATION}/logs`
export const FILES_LOCATION = `${DATA_LOCATION}/files`

export const GITHUB_CACHE_URL =
  "https://raw.githubusercontent.com/privatefolio/coingecko/refs/heads/main/public"

export const PARSER_IDS = [
  "binance-account-statement",
  "binance-spot-history",
  // "binance-deposit-history",
  "coinmama",
  "etherscan",
  "etherscan-erc20",
  "etherscan-internal",
  "etherscan-block-rewards",
  "etherscan-beacon-withdrawals",
  "mexc",
  "privatefolio",
  "blockpit",
] as const

export type ParserId = (typeof PARSER_IDS)[number]

export type ParserMeta = {
  name: string
  // platformImage: string
}

export const PARSERS_META: Record<ParserId, ParserMeta> = {
  "binance-account-statement": {
    name: "Binance Account Statement",
  },
  // "binance-deposit-history": {
  //   name: "Binance Deposit History",
  // },
  "binance-spot-history": {
    name: "Binance Spot History",
  },
  blockpit: { name: "Blockpit" },
  coinmama: { name: "Coinmama" },
  etherscan: { name: "Etherscan" },
  "etherscan-beacon-withdrawals": {
    name: "Etherscan Beacon Withdrawals",
  },
  "etherscan-block-rewards": {
    name: "Etherscan Block Rewards",
  },
  "etherscan-erc20": { name: "Etherscan ERC-20" },
  "etherscan-internal": { name: "Etherscan Internal" },
  mexc: { name: "Mexc" },
  privatefolio: { name: "Privatefolio" },
}

export const BINANCE_WALLET_IDS = [
  "coinFutures",
  "crossMargin",
  "isolatedMargin",
  "spot",
  "usdFutures",
] as const

export type BinanceWalletId = (typeof BINANCE_WALLET_IDS)[number]

export const BINANCE_WALLET_LABELS: Record<BinanceWalletId, string> = {
  coinFutures: "Coin-M Futures",
  crossMargin: "Cross Margin",
  isolatedMargin: "Isolated Margin",
  spot: "Spot",
  usdFutures: "USD-M Futures",
}

export const PLATFORM_IDS = [
  "binance",
  "blockpit",
  "coinmama",
  "ethereum",
  "eip155-137",
  "eip155-8453",
  "eip155-10",
  "eip155-42161",
  "coinbase",
  "mexc",
  "privatefolio",
  "cex-io",
] as const

export type PlatformId = (typeof PLATFORM_IDS)[number]

export type PlatformMeta = {
  blockExplorer?: {
    name: string
    url: string
  }
  coingeckoId?: string
  logoUrl: string
  name: string
  nativeAssetId?: string
}

export const PLATFORMS_META: Record<PlatformId, PlatformMeta> = {
  binance: {
    logoUrl: "https://assets.coingecko.com/markets/images/52/small/binance.jpg?1519353250",
    name: "Binance",
  },
  blockpit: { logoUrl: "/app-data/integrations/blockpit.png", name: "Blockpit" },
  "cex-io": { logoUrl: "/app-data/integrations/cex-io.png", name: "CEX" },
  coinbase: { logoUrl: "", name: "Coinbase" },
  coinmama: { logoUrl: "/app-data/integrations/coinmama.png", name: "Coinmama" },
  "eip155-10": {
    coingeckoId: "optimism",
    logoUrl: "https://icons.llamao.fi/icons/chains/rsz_optimism.jpg",
    name: "Optimism",
    nativeAssetId: "eip155-10:0x0000000000000000000000000000000000000000:ETH",
  },
  "eip155-137": {
    blockExplorer: {
      name: "PolygonScan",
      url: "https://polygonscan.com",
    },
    coingeckoId: "polygon-pos",
    logoUrl: "https://icons.llamao.fi/icons/chains/rsz_polygon.jpg",
    name: "Polygon",
    nativeAssetId: "eip155-137:0x0000000000000000000000000000000000000000:MATIC",
  },
  "eip155-42161": {
    blockExplorer: {
      name: "ArbiScan",
      url: "https://arbiscan.io",
    },
    coingeckoId: "arbitrum-one",
    logoUrl: "https://assets.coingecko.com/asset_platforms/images/33/small/AO_logomark.png",
    name: "Arbitrum One",
    nativeAssetId: "eip155-42161:0x0000000000000000000000000000000000000000:ETH",
  },
  "eip155-8453": {
    blockExplorer: {
      name: "BaseScan",
      url: "https://basescan.org",
    },
    coingeckoId: "base",
    logoUrl: "https://icons.llamao.fi/icons/chains/rsz_base.jpg",
    name: "Base",
    nativeAssetId: "eip155-8453:0x0000000000000000000000000000000000000000:ETH",
  },
  ethereum: {
    blockExplorer: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
    coingeckoId: "ethereum",
    logoUrl: "https://assets.coingecko.com/asset_platforms/images/279/small/ethereum.png",
    name: "Ethereum",
    nativeAssetId: "ethereum:0x0000000000000000000000000000000000000000:ETH",
  },
  mexc: { logoUrl: "", name: "MEXC Global" },
  privatefolio: { logoUrl: "/privatefolio.svg", name: "Privatefolio" },
}

export const getPlatformIdFromCoingeckoId = (coingeckoId: string): PlatformId | undefined =>
  PLATFORM_IDS.find((platformId) => PLATFORMS_META[platformId].coingeckoId === coingeckoId)

export function getBlockExplorerUrl(platformId: string, addr: string, type: string) {
  const { blockExplorer } = PLATFORMS_META[platformId as PlatformId]
  if (!blockExplorer) return ""

  return `${blockExplorer.url}/${type}/${addr}`
}

export function getBlockExplorerName(platformId: string) {
  const { blockExplorer } = PLATFORMS_META[platformId as PlatformId]
  if (!blockExplorer) return ""

  return blockExplorer.name
}

export const CONNECTIONS: PlatformId[] = [
  "eip155-42161",
  "eip155-8453",
  "eip155-137",
  "eip155-10",
  "ethereum",
  "binance",
]

export const SHORT_THROTTLE_DURATION = 200
export const MEDIUM_THROTTLE_DURATION = 1_000
export const LONG_THROTTLE_DURATION = 2_000

export const DEFAULT_DEBOUNCE_DURATION = 1500

export const DB_OPERATION_PAGE_SIZE = 1000
export const PRICE_API_PAGINATION = 900 // coinbase limit is 300, binance is 1000

export const PRICE_API_IDS = ["coinbase", "binance", "defi-llama"] as const
export type PriceApiId = (typeof PRICE_API_IDS)[number]

export type PriceApiMeta = {
  logoUrl: string
  name: string
}

export const PRICE_APIS_META: Record<PriceApiId, PriceApiMeta> = {
  binance: {
    logoUrl: "/app-data/integrations/binance.svg",
    name: "Binance",
  },
  coinbase: {
    logoUrl: "/app-data/integrations/coinbase.svg",
    name: "Coinbase",
  },
  "defi-llama": {
    logoUrl: "/app-data/integrations/defi-llama.png",
    name: "DefiLlama",
  },
}

export const API_KEYS: Partial<Record<PlatformId, string>> = {
  "eip155-42161": "536HFC6SEA6TH2XUQZ8DFFFD77PJP8QMBQ",
  "eip155-8453": "WJPKFYTUSTH1N9AM2I947BJ2918GUF58JR",
  ethereum: "3JHR8S44XRG5VAN774EGSBY175A1QE2EZA",
}

export const WETH_ASSET_ID = "ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2:WETH"
