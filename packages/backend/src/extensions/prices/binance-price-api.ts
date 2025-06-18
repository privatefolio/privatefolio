import {
  BinanceKline,
  ChartData,
  QueryRequest,
  ResolutionString,
  Time,
  Timestamp,
} from "../../interfaces"
import { GITHUB_CI } from "../../server-env"
import { PriceApiId, WETH_ASSET_ID } from "../../settings/settings"
import { getAssetTicker } from "../../utils/assets-utils"
import { getBucketSize, paginatePriceRequest } from "../../utils/utils"

export const Identifier: PriceApiId = "binance"

export function getPair(assetId: string) {
  if (assetId === WETH_ASSET_ID) return "ETHUSDT"
  return `${getAssetTicker(assetId)}USDT`
}

export function getPairDescription(assetId: string) {
  const ticker = getAssetTicker(assetId)
  return [`${ticker}USDT`, `${ticker} / TetherUS`]
}

// https://developers.binance.com/docs/binance-spot-api-docs/websocket-api/market-data-requests#klines
// Supported kline intervals (case-sensitive):
// Interval	interval value
// seconds	1s
// minutes	1m, 3m, 5m, 15m, 30m
// hours	1h, 2h, 4h, 6h, 8h, 12h
// days	1d, 3d
// weeks	1w
// months	1M
function getInterval(timeInterval: ResolutionString) {
  timeInterval = timeInterval.toUpperCase() as ResolutionString

  // Seconds
  if (timeInterval === "1S") return "1s"

  // Minutes
  if (timeInterval === "1") return "1m"
  if (timeInterval === "3") return "3m"
  if (timeInterval === "5") return "5m"
  if (timeInterval === "15") return "15m"
  if (timeInterval === "30") return "30m"

  // Hours
  if (timeInterval === "60") return "1h"
  if (timeInterval === "120") return "2h"
  if (timeInterval === "240") return "4h"

  // Days/Weeks/Months
  if (timeInterval === "1D") return "1d"
  if (timeInterval === "1W") return "1w"
  if (timeInterval === "1M") return "1M"

  throw new Error(`Binance does not support the '${timeInterval}' time interval.`)
}

const pageLimit = 900

// https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data
export async function queryPrices(request: QueryRequest) {
  if (GITHUB_CI) {
    throw new Error("Binance price API is disabled")
  }

  const { timeInterval, pair } = request
  const limit = request.limit || pageLimit
  const binanceInterval = getInterval(timeInterval)

  const bucketSize = getBucketSize(timeInterval)
  const bucketSizeInMs = bucketSize * 1000

  // until & since always need to be set
  const now = Date.now()
  const today: Timestamp = now - (now % bucketSizeInMs)

  const until = request.until || today
  const since = request.since || until - bucketSizeInMs * limit

  const { validSince, previousPage } = await paginatePriceRequest<BinanceKline>({
    bucketSizeInMs,
    limit,
    pageLimit,
    queryFn: async (since, until, limit) =>
      queryPrices({ limit, pair, since, timeInterval, until }),
    since,
    until,
  })

  let apiUrl = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${binanceInterval}&limit=${Math.min(pageLimit, limit)}`

  if (validSince && until) {
    apiUrl = `${apiUrl}&startTime=${validSince}`
    apiUrl = `${apiUrl}&endTime=${until}`
  }

  try {
    const res = await fetch(apiUrl)
    const data = await res.json()

    if (data.msg?.includes("Invalid symbol")) {
      throw new Error("Binance: NotFound")
    }

    if (data.code) {
      throw new Error(`Binance: ${data.msg} (${data.code})`)
    }

    const currentPage = (data as BinanceKline[]).slice(-pageLimit)
    return previousPage.concat(currentPage).slice(0, limit)
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      // safely assume its a cors error due to coin not found
      throw new Error(`Binance: UnknownError: ${String(error)}`)
    }
    // console.error(error)
    throw error
  }
}

export function mapToChartData(kline: BinanceKline): ChartData {
  const open = parseFloat(kline[1])
  const high = parseFloat(kline[2])
  const low = parseFloat(kline[3])
  const close = parseFloat(kline[4])
  const volume = parseFloat(kline[5])
  const time = (kline[0] / 1000) as Time

  return {
    close,
    high,
    low,
    open,
    time,
    value: close,
    volume,
  }
}

// export function createBinanceSubscribe(query: QueryFn) {
//   return function subscribe(request: SubscribeRequest): SubscribeResult {
//     const {
//       timeframe,
//       since,
//       onNewData,
//       priceUnit,
//       pollingInterval = DEFAULT_POLLING_INTERVAL,
//       variant,
//     } = request
//     let lastTimestamp = since

//     const intervalId = setInterval(async () => {
//       const data = await query({ priceUnit, since: lastTimestamp, timeframe, variant })

//       if (data.length) {
//         lastTimestamp = data[data.length - 1].timestamp
//         data.forEach(onNewData)
//       }
//     }, pollingInterval)

//     return function cleanup() {
//       clearInterval(intervalId)
//     }
//   }
// }
