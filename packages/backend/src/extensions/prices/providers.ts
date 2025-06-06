import { ChartData, QueryRequest } from "src/interfaces"
import { PriceApiId } from "src/settings/settings"

import * as binance from "./binance-price-api"
import * as coinbase from "./coinbase-price-api"
import * as llama from "./llama-price-api"

type PriceMapper = (data: any) => ChartData
type PairMapper = (symbol: string) => string
type PriceApi = (request: QueryRequest) => Promise<any>

export const PRICE_MAPPER: Record<PriceApiId, PriceMapper> = {
  binance: binance.mapToChartData,
  coinbase: coinbase.mapToChartData,
  "defi-llama": llama.mapToChartData,
}

export const PRICE_APIS: Record<PriceApiId, PriceApi> = {
  binance: binance.queryPrices,
  coinbase: coinbase.queryPrices,
  "defi-llama": llama.queryPrices,
}

export const PAIR_MAPPER: Record<PriceApiId, PairMapper> = {
  binance: binance.getPair,
  coinbase: coinbase.getPair,
  "defi-llama": llama.getPair,
}
