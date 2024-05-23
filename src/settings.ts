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
  "etherscan-erc20": { name: "Etherscan ERC-20" },
  "etherscan-internal": { name: "Etherscan Internal" },
  mexc: { name: "Mexc" },
  privatefolio: { name: "Privatefolio" },
}

export const PLATFORM_IDS = [
  "binance",
  "blockpit",
  "coinmama",
  "ethereum",
  "eip155-137",
  "eip155-8453",
  "eip155-42161",
  "coinbase",
  "mexc",
  "privatefolio",
] as const

export type PlatformId = (typeof PLATFORM_IDS)[number]

export type PlatformMeta = {
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
  coinbase: { logoUrl: "", name: "Coinbase" },
  coinmama: { logoUrl: "", name: "Coinmama" },
  "eip155-137": {
    coingeckoId: "polygon-pos",
    logoUrl: "https://icons.llamao.fi/icons/chains/rsz_polygon.jpg",
    name: "Polygon",
    nativeAssetId: "eip155-137:0x0000000000000000000000000000000000000000:MATIC",
  },
  "eip155-42161": {
    coingeckoId: "arbitrum-one",
    logoUrl: "https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg",
    name: "Arbitrum",
    nativeAssetId: "eip155-42161:0x0000000000000000000000000000000000000000:ETH",
  },
  "eip155-8453": {
    coingeckoId: "base",
    logoUrl: "https://icons.llamao.fi/icons/chains/rsz_base.jpg",
    name: "Base",
    nativeAssetId: "eip155-42161:0x0000000000000000000000000000000000000000:ETH",
  },
  ethereum: {
    coingeckoId: "ethereum",
    logoUrl: "https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg",
    name: "Ethereum",
    nativeAssetId: "ethereum:0x0000000000000000000000000000000000000000:ETH",
  },
  mexc: { logoUrl: "", name: "MEXC Global" },
  privatefolio: { logoUrl: "/privatefolio.svg", name: "Privatefolio" },
}

export const CONNECTIONS: PlatformId[] = ["eip155-42161", "eip155-8453", "ethereum", "binance"]

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
