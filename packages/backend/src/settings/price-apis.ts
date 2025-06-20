import { ResolutionString } from "src/interfaces"

import { isTestEnvironment } from "../utils/environment-utils"

const PRICE_API_IDS = ["coinbase", "binance", "defi-llama", "alchemy"] as const
export type PriceApiId = (typeof PRICE_API_IDS)[number]

export const SUPPORTED_RESOLUTIONS = [
  "1S",
  "1",
  "3",
  "5",
  "15",
  "30",
  "60",
  "120",
  "240",
  "1D",
  "1W",
  "1M",
] as ResolutionString[]

export type PriceApiMeta = {
  hasCandles: boolean
  logoUrl: string
  name: string
  priority: number
  supportedResolutions: ResolutionString[]
  url: string
}

export const PRICE_APIS_META: Record<PriceApiId, PriceApiMeta> = {
  alchemy: {
    hasCandles: false,
    logoUrl: "$STATIC_ASSETS/extensions/alchemy.svg",
    name: "Alchemy",
    priority: 5,
    supportedResolutions: ["5", "60", "1D"] as ResolutionString[],
    url: "https://alchemy.com",
  },
  binance: {
    hasCandles: true,
    logoUrl: "$STATIC_ASSETS/extensions/binance.svg",
    name: "Binance",
    priority: isTestEnvironment ? 10 : 2,
    supportedResolutions: SUPPORTED_RESOLUTIONS,
    url: "https://binance.com",
  },
  coinbase: {
    hasCandles: true,
    logoUrl: "$STATIC_ASSETS/extensions/coinbase.svg",
    name: "Coinbase",
    priority: 1,
    supportedResolutions: ["1", "5", "15", "60", "360", "1D"] as ResolutionString[],
    url: "https://coinbase.com",
  },
  "defi-llama": {
    hasCandles: false,
    logoUrl: "$STATIC_ASSETS/extensions/defi-llama.png",
    name: "DefiLlama",
    priority: 5,
    supportedResolutions: [
      "1",
      "3",
      "5",
      "15",
      "30",
      "60",
      "120",
      "240",
      "1D",
      "1W",
    ] as ResolutionString[],
    url: "https://defillama.com",
  },
}

export const allPriceApiIds = (Object.keys(PRICE_APIS_META) as PriceApiId[]).sort(
  (a, b) => PRICE_APIS_META[a].priority - PRICE_APIS_META[b].priority
)
