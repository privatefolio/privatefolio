export const PRICE_API_IDS = ["coinbase", "binance", "defi-llama"] as const
export type PriceApiId = (typeof PRICE_API_IDS)[number]

export type PriceApiMeta = {
  logoUrl: string
  name: string
}

export const PRICE_APIS_META: Record<PriceApiId, PriceApiMeta> = {
  binance: {
    logoUrl: "$STATIC_ASSETS/extensions/binance.svg",
    name: "Binance",
  },
  coinbase: {
    logoUrl: "$STATIC_ASSETS/extensions/coinbase.svg",
    name: "Coinbase",
  },
  "defi-llama": {
    logoUrl: "$STATIC_ASSETS/extensions/defi-llama.png",
    name: "DefiLlama",
  },
}
