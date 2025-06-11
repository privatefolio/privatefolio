const PRICE_API_IDS = ["coinbase", "binance", "defi-llama"] as const
export type PriceApiId = (typeof PRICE_API_IDS)[number]

export type PriceApiMeta = {
  logoUrl: string
  name: string
  priority: number
}

export const PRICE_APIS_META: Record<PriceApiId, PriceApiMeta> = {
  binance: {
    logoUrl: "$STATIC_ASSETS/extensions/binance.svg",
    name: "Binance",
    priority: 2,
  },
  coinbase: {
    logoUrl: "$STATIC_ASSETS/extensions/coinbase.svg",
    name: "Coinbase",
    priority: 1,
  },
  "defi-llama": {
    logoUrl: "$STATIC_ASSETS/extensions/defi-llama.png",
    name: "DefiLlama",
    priority: 5,
  },
}

export const allPriceApiIds = (Object.keys(PRICE_APIS_META) as PriceApiId[]).sort(
  (a, b) => PRICE_APIS_META[a].priority - PRICE_APIS_META[b].priority
)
