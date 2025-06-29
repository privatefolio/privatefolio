import {
  AlchemyPrice,
  ChartData,
  QueryRequest,
  ResolutionString,
  Time,
  Timestamp,
} from "../../interfaces"
import { PriceApiId } from "../../settings/settings"
import {
  getAssetContract,
  getAssetPlatform,
  getAssetTicker,
  isNativeAsset,
  removePlatformPrefix,
} from "../../utils/assets-utils"
import { isServer } from "../../utils/environment-utils"
import {
  approximateTimestamp,
  ensureValidBuckets,
  getBucketSize,
  paginatePriceRequest,
} from "../../utils/utils"

export const Identifier: PriceApiId = "alchemy"

export function getPair(assetId: string) {
  const contract = getAssetContract(assetId)
  const platformId = getAssetPlatform(assetId)
  const coingeckoId = removePlatformPrefix(platformId)
  const ticker = getAssetTicker(assetId)

  const isNative = isNativeAsset(contract)

  if (isNative) {
    return ticker
  }

  const network = getNetwork(coingeckoId)

  if (!network) {
    if (!ticker) throw new Error("Alchemy: No network or ticker")
    return ticker
  }

  return `${network}:${contract}`
}

export function getPairDescription(assetId: string) {
  const ticker = getAssetTicker(assetId)
  return [ticker, `${ticker} / US Dollar`]
}

function getInterval(timeInterval: ResolutionString) {
  timeInterval = timeInterval.toUpperCase() as ResolutionString

  if (timeInterval === "5") return "5m"
  if (timeInterval === "60") return "1h"
  if (timeInterval === "1D") return "1d"

  throw new Error(`Alchemy does not support the '${timeInterval}' time interval.`)
}

function getNetwork(coingeckoId: string) {
  if (coingeckoId === "ethereum") return "eth-mainnet"
  if (coingeckoId === "arbitrum-one") return "arb-mainnet"
  if (coingeckoId === "optimistic-ethereum") return "opt-mainnet"
  if (coingeckoId === "base") return "base-mainnet"
  if (coingeckoId === "polygon-pos") return "polygon-mainnet"
  return ""
}

// Alchemy only allows
// 365 days of data per request when using the 1d interval
// 30 days of data per request when using the 1h interval (720 data points)
// 7 days of data per request when using the 5m interval (2016 data points)
const getPageLimit = (timeInterval: ResolutionString) => {
  if (timeInterval === "1h") return 720
  if (timeInterval === "5m") return 2016
  return 365
}

// https://www.alchemy.com/docs/data/prices-api/prices-api-endpoints/prices-api-endpoints/get-historical-token-prices
export async function queryPrices(request: QueryRequest) {
  const { timeInterval, pair } = request
  const pageLimit = getPageLimit(timeInterval)
  const limit = request.limit || pageLimit

  let address: string, network: string, ticker: string

  if (pair.includes(":")) {
    const parts = pair.split(":")
    network = parts[0]
    address = parts[1]
  } else {
    ticker = pair
  }

  if ((!network || !address) && !ticker) {
    return []
  }

  const bucketSize = getBucketSize(timeInterval)
  const bucketSizeInMs = bucketSize * 1000

  // until & since always need to be set
  const now = Date.now()
  const today: Timestamp = now - (now % bucketSizeInMs)

  const until = request.until || today
  const since = request.since || until - bucketSizeInMs * limit

  const apiKey = (isServer && process.env.ALCHEMY_API_KEY) || "BMARMYOT5kqVmbLXs_kz-"
  const apiUrl = `https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/historical`

  const { validSince, previousPage } = await paginatePriceRequest<ChartData>({
    bucketSizeInMs,
    limit,
    pageLimit,
    queryFn: async (since, until, limit) =>
      queryPrices({ limit, pair, since, timeInterval, until }),
    since,
    until,
  })

  const payload = {
    address,
    endTime: new Date((until || Date.now()) + 1).toISOString(),
    interval: getInterval(timeInterval),
    network,
    startTime: new Date(validSince).toISOString(),
    symbol: ticker,
  }

  const res = await fetch(apiUrl, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  if (!res.ok) {
    const text = await res.text()
    if (text.includes("Internal server error") || text.includes("not found")) {
      throw new Error("Alchemy: NotFound")
    }
    throw new Error(`Alchemy: ${res.statusText} ${text}`)
  }

  const { data } = await res.json()
  if (!data) return []
  const prices = data.slice(-pageLimit) as AlchemyPrice[]

  const patched = ensureValidBuckets(
    prices.map((price) => ({
      time: approximateTimestamp(new Date(price.timestamp).getTime() / 1000, timeInterval) as Time,
      value: parseFloat(price.value),
    })),
    timeInterval
  )

  return previousPage.concat(patched).slice(0, limit)
}

export function mapToChartData(data: ChartData): ChartData {
  return data
}
