import { ChartData, QueryRequest, ResolutionString, Timestamp } from "../../interfaces"
import { PRICE_APIS_META, PriceApiId } from "../../settings/settings"
import * as alchemy from "./alchemy-price-api"
import * as binance from "./binance-price-api"
import * as coinbase from "./coinbase-price-api"
import * as llama from "./llama-price-api"

type PriceMapper = (data: any) => ChartData
type PairMapper = (symbol: string) => string
type PriceApi = (request: QueryRequest) => Promise<any>

export const PRICE_MAPPER: Record<PriceApiId, PriceMapper> = {
  alchemy: alchemy.mapToChartData,
  binance: binance.mapToChartData,
  coinbase: coinbase.mapToChartData,
  "defi-llama": llama.mapToChartData,
}

export const PRICE_APIS: Record<PriceApiId, PriceApi> = {
  alchemy: alchemy.queryPrices,
  binance: binance.queryPrices,
  coinbase: coinbase.queryPrices,
  "defi-llama": llama.queryPrices,
}

export const PAIR_MAPPER: Record<PriceApiId, PairMapper> = {
  alchemy: alchemy.getPair,
  binance: binance.getPair,
  coinbase: coinbase.getPair,
  "defi-llama": llama.getPair,
}

export async function getLivePricesForAsset(
  assetId: string,
  priceApiId: PriceApiId,
  // TODO9 allow more
  limit = 300
): Promise<ChartData[]> {
  const priceApi = PRICE_APIS[priceApiId]
  const priceMapper = PRICE_MAPPER[priceApiId]
  const pairMapper = PAIR_MAPPER[priceApiId]

  if (!priceApi || !priceMapper || !pairMapper) {
    throw new Error(`Price API "${priceApiId}" is not supported`)
  }

  const pair = pairMapper(assetId)
  const now = Date.now()
  const today: Timestamp = now - (now % 86400000)
  const since = today - 86400000 * (limit - 1)

  const results = await priceApi({
    limit,
    pair,
    since,
    timeInterval: "1d" as ResolutionString,
    until: today,
  })

  if (results.length === 0) {
    throw new Error(`${PRICE_APIS_META[priceApiId].name} EmptyResponse`)
  }

  return results.map(priceMapper)
}
