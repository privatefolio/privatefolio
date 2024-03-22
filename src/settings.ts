export const ASSET_FILES_LOCATION = "app-data/assets"

export const EXCHANGE_PAGES = 2
export const EXCHANGE_FILES_LOCATION = "app-data/exchanges"

export const BLOCKCHAIN_PAGES = 1
export const BLOCKCHAIN_FILES_LOCATION = "app-data/blockchains"

export const PARSER_IDS = [
  "binance-account-statement",
  "binance-spot-history",
  // "binance-deposit-history",
  "coinmama",
  "etherscan",
  "etherscan-erc20",
  "etherscan-internal",
  "mexc",
  "privatefolio",
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
  coinmama: { name: "Coinmama" },
  etherscan: { name: "Etherscan" },
  "etherscan-erc20": { name: "Etherscan ERC-20" },
  "etherscan-internal": { name: "Etherscan Internal" },
  mexc: { name: "Mexc" },
  privatefolio: { name: "Privatefolio" },
}

export const PLATFORM_IDS = [
  // "arbitrum",
  "binance",
  "coinmama",
  "ethereum",
  "coinbase",
  // "evm",
  "mexc",
  // "op",
  // "polygon",
] as const

export type PlatformId = (typeof PLATFORM_IDS)[number]

export type PlatformMeta = {
  logoUrl: string
  name: string
  nativeAssetId?: string
}

export const PLATFORMS_META: Record<PlatformId, PlatformMeta> = {
  binance: {
    logoUrl: "https://assets.coingecko.com/markets/images/52/small/binance.jpg?1519353250",
    name: "Binance",
  },
  coinbase: { logoUrl: "", name: "Coinbase" },
  coinmama: { logoUrl: "", name: "Coinmama" },
  ethereum: {
    logoUrl: "https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg",
    name: "Ethereum",
    nativeAssetId: "ethereum:0x0000000000000000000000000000000000000000:ETH",
  },
  mexc: { logoUrl: "", name: "MEXC Global" },
}

export const CONNECTIONS = {
  binance: "Binance",
  ethereum: "Ethereum",
} as const

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
