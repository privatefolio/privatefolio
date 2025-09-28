import { ChartData, QueryRequest, ResolutionString, Time, Timestamp } from "../../interfaces"
import { PlatformPrefix } from "../../settings/config"
import { getAssetPlatform, getAssetTicker, getPlatformPrefix } from "../../utils/assets-utils"
import { ensureValidBuckets, floorTimestamp, getBucketSize } from "../../utils/utils"

type YahooFinanceInterval =
  | "1m"
  | "2m"
  | "5m"
  | "15m"
  | "30m"
  | "60m"
  | "90m"
  | "1h"
  | "4h"
  | "1d"
  | "5d"
  | "1wk"
  | "1mo"
  | "3mo"

function mapInterval(interval: ResolutionString): YahooFinanceInterval {
  switch (interval.toLowerCase()) {
    // Minutes
    case "1":
      return "1m"
    case "2":
      return "2m"
    case "5":
      return "5m"
    case "15":
      return "15m"
    case "30":
      return "30m"
    case "60":
      return "1h"
    case "90":
      return "90m"

    // Days
    case "1d":
      return "1d"
    case "5d":
      return "5d"

    // Weeks
    case "1w":
      return "1wk"

    // Months
    case "1m":
      return "1mo"
    case "3m":
      return "3mo"

    default:
      throw new Error(`Unsupported resolution: ${interval}`)
  }
}

export function getPair(assetId: string) {
  const platformId = getAssetPlatform(assetId)
  const platformPrefix = getPlatformPrefix(platformId)
  if (platformPrefix === PlatformPrefix.Gov) return getAssetTicker(assetId)
  return `${getAssetTicker(assetId)}-USD`
}

export function getPairDescription(assetId: string) {
  return [getPair(assetId)]
}

export function mapToChartData(data: ChartData): ChartData {
  return data
}

export type YahooQuote = {
  close: number[]
  high: number[]
  low: number[]
  open: number[]
  volume?: number[]
}

export async function queryPrices(request: QueryRequest): Promise<ChartData[]> {
  const { limit = 900, pair: symbol, timeInterval } = request

  if (limit < 1) return []

  const bucketSize = getBucketSize(timeInterval)
  const bucketSizeInMs = bucketSize * 1000

  // until & since always need to be set
  const now = Date.now()
  const today: Timestamp = now - (now % bucketSizeInMs)

  let until = request.until
  if (!request.since && !request.until) until = today
  const since = request.since || until - bucketSizeInMs * limit
  if (!until && since) until = since + bucketSizeInMs * limit

  // this is because exchangeTimezoneName can be different than UTC
  until = until + bucketSizeInMs - 1000

  const period1 = Math.floor(since / 1000)
  const period2 = Math.floor(until / 1000)
  const interval = mapInterval(timeInterval)

  const params = new URLSearchParams()
  params.set("interval", interval)
  params.set("period1", String(period1))
  params.set("period2", String(period2))
  // params.set("includePrePost", "true")

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params.toString()}`

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Privatefolio/2.0 (hello@danielconstantin.net)",
    },
  })
  const json = await res.json()

  const result = json?.chart?.result?.[0]
  if (!result) {
    if (json?.finance?.error?.code) {
      throw new Error(`Yahoo: ${json.finance.error.code} ${json.finance.error.description}`)
    }
    if (json?.chart?.error?.code) {
      throw new Error(`Yahoo: ${json.chart.error.code} ${json.chart.error.description}`)
    }

    throw new Error("Yahoo: UnknownError")
  }

  const timeArray: Time[] = result.timestamp || []
  const quote: YahooQuote = result.indicators?.quote?.[0] || {}
  const { close = [], high = [], low = [], open = [], volume = [] } = quote

  const data: ChartData[] = timeArray.map((time, index) => ({
    close: close[index],
    high: high[index],
    low: low[index],
    open: open[index],
    time: floorTimestamp(time * 1000, timeInterval) / 1000,
    value: close[index],
    volume: volume[index],
  }))

  const patched = ensureValidBuckets(data, timeInterval, period2)

  return patched.slice(-limit)
}
