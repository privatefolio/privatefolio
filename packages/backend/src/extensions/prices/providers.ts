import { ChartData, QueryRequest, ResolutionString, Timestamp } from "../../interfaces"
import { PRICE_API_PAGINATION, PriceApiId } from "../../settings/settings"
import { getBucketSize } from "../../utils/utils"
import * as alchemy from "./alchemy-price-api"
import * as binance from "./binance-price-api"
import * as coinbase from "./coinbase-price-api"
import * as llama from "./llama-price-api"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PriceMapper = (data: any) => ChartData
type PairMapper = (symbol: string) => string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PriceApi = (request: QueryRequest) => Promise<any>

type PriceApiExtension = {
  getPair: PairMapper
  getPairDescription: (assetId: string) => string[]
  mapToChartData: PriceMapper
  queryPrices: PriceApi
}

export const PRICE_API_MATCHER: Record<PriceApiId, PriceApiExtension> = {
  alchemy,
  binance,
  coinbase,
  "defi-llama": llama,
}

export async function getLivePricesForAsset(
  assetId: string,
  priceApiId: PriceApiId,
  limit = PRICE_API_PAGINATION,
  timeInterval = "1d" as ResolutionString,
  since?: Timestamp,
  until?: Timestamp
): Promise<ChartData[]> {
  const priceApi = PRICE_API_MATCHER[priceApiId]

  if (!priceApi) {
    throw new Error(`Price API "${priceApiId}" is not supported`)
  }

  const pair = priceApi.getPair(assetId)

  if (!since && !until) {
    const bucketSize = getBucketSize(timeInterval)
    const bucketSizeInMs = bucketSize * 1000
    const now = Date.now()
    until = now - (now % bucketSizeInMs)
    since = until - bucketSizeInMs * (limit - 1)
  }

  const results = await priceApi.queryPrices({
    limit,
    pair,
    since,
    timeInterval,
    until,
  })

  return results.map(priceApi.mapToChartData)
}
