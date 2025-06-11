import { BinanceKline, ChartData, QueryRequest, ResolutionString, Time } from "../../interfaces"
import { GITHUB_CI } from "../../server-env"
import { PriceApiId, WETH_ASSET_ID } from "../../settings/settings"
import { getAssetTicker } from "../../utils/assets-utils"

export const Identifier: PriceApiId = "binance"

export function getPair(assetId: string) {
  if (assetId === WETH_ASSET_ID) return "ETHUSDT"
  return `${getAssetTicker(assetId)}USDT`
}

// https://binance-docs.github.io/apidocs/spot/en/#general-api-information
// The following intervalLetter values for headers:
// SECOND => S
// MINUTE => M
// HOUR => H
// DAY => D
// intervalNum describes the amount of the interval. For example, intervalNum 5 with intervalLetter M means "Every 5 minutes".
// The /api/v3/exchangeInfo rateLimits array contains objects related to the exchange's RAW_REQUESTS, REQUEST_WEIGHT, and ORDERS rate limits. These are further defined in the ENUM definitions section under Rate limiters (rateLimitType).
// A 429 will be returned when either request rate limit or order rate limit is violated.
function getInterval(timeInterval: ResolutionString) {
  // if (!supportedTimeframes.includes(timeframe)) {
  //   throw new Error(`Timeframe '${timeframe}' is not supported for this metric.`)
  // }
  return timeInterval
}

// https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data
export async function queryPrices(request: QueryRequest) {
  if (GITHUB_CI) {
    throw new Error("Binance price API is disabled")
  }

  const { timeInterval, since, until, limit = 900, pair } = request
  const binanceInterval = getInterval(timeInterval)

  let apiUrl = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${binanceInterval}&limit=${limit}`

  if (since && until) {
    apiUrl = `${apiUrl}&startTime=${since}`
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

    return data as BinanceKline[]
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      // safely assume its a cors error due to coin not found
      throw new Error("Binance: NotFound")
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
