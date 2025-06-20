import { ChartData, CoinbaseBucket, QueryRequest, ResolutionString, Time } from "../../interfaces"
import { PriceApiId, WETH_ASSET_ID } from "../../settings/settings"
import { getAssetTicker } from "../../utils/assets-utils"
import { paginatePriceRequest } from "../../utils/utils"

export const Identifier: PriceApiId = "coinbase"

export function getPair(assetId: string) {
  if (assetId === WETH_ASSET_ID) return "ETH-USD"
  return `${getAssetTicker(assetId)}-USD`
}

export function getPairDescription(assetId: string) {
  const ticker = getAssetTicker(assetId)
  return [`${ticker}USD`, `${ticker} / US Dollar`]
}

// Coinbase only allows 300 records per request
const pageLimit = 300

// https://docs.cdp.coinbase.com/exchange/reference/exchangerestapi_getproductcandles
// The granularity field must be one of the following values: {60, 300, 900, 3600, 21600, 86400}.
// Otherwise, your request will be rejected. These values correspond to timeslices representing one minute,
// five minutes, fifteen minutes, one hour, six hours, and one day, respectively.
function getInterval(timeInterval: ResolutionString): number {
  timeInterval = timeInterval.toUpperCase() as ResolutionString

  // Minutes
  if (timeInterval === "1") return 60
  if (timeInterval === "5") return 300
  if (timeInterval === "15") return 900

  // Hours
  if (timeInterval === "60") return 3600
  if (timeInterval === "360") return 21600

  // Days
  if (timeInterval === "1D") return 86400

  throw new Error(
    `Coinbase does not support the '${timeInterval}' time interval. Supported intervals: 1m, 5m, 15m, 1h, 6h, 1d`
  )
}

// https://docs.cloud.coinbase.com/exchange/reference/exchangerestapi_getproductcandles
// https://docs.cloud.coinbase.com/advanced-trade-api/reference/retailbrokerageapi_getcandles
export async function queryPrices(request: QueryRequest) {
  const { timeInterval, since, until, limit = pageLimit, pair } = request
  const coinbaseInterval = getInterval(timeInterval)
  const timestampOffset = coinbaseInterval * 1000

  if (limit < 1) return []

  let apiUrl = `https://api.exchange.coinbase.com/products/${pair}/candles?granularity=${coinbaseInterval}`

  const { validSince, previousPage } = await paginatePriceRequest<CoinbaseBucket>({
    bucketSizeInMs: timestampOffset,
    limit,
    pageLimit,
    queryFn: async (since, until, limit) =>
      queryPrices({ limit, pair, since, timeInterval, until }),
    since,
    until,
  })

  if (validSince) {
    apiUrl = `${apiUrl}&start=${validSince}`
  } else if (until) {
    apiUrl = `${apiUrl}&start=${until - timestampOffset * pageLimit}`
  }
  if (until) {
    apiUrl = `${apiUrl}&end=${until}`
  } else if (validSince) {
    apiUrl = `${apiUrl}&end=${validSince + timestampOffset * pageLimit}`
  }

  const res = await fetch(apiUrl)
  const data = await res.json()

  if ("message" in data) {
    if (data.message.includes("Invalid start")) {
      // there is no data as old as this
      return []
    }
    throw new Error(`Coinbase: ${data.message}`)
  }

  const buckets = data.reverse() as CoinbaseBucket[]

  if (buckets.length > limit) {
    const end = buckets.length
    return buckets.slice(end - limit, end)
  }

  // .slice should not be needed, but a new change in the API is returning more data 300 records
  return previousPage.concat(buckets).slice(-limit)
}

export function mapToChartData(bucket: CoinbaseBucket): ChartData {
  const open = bucket[3]
  const high = bucket[2]
  const low = bucket[1]
  const close = bucket[4]
  const volume = bucket[5]
  const time = bucket[0] as Time

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

// export function createCoinbaseSubscribe(query: QueryFn) {
//   return function subscribe(request: SubscribeRequest): SubscribeResult {
//     const {
//       timeframe,
//       since,
//       onNewData,
//       onError = noop, // TODO0 for all
//       priceUnit,
//       pollingInterval = DEFAULT_POLLING_INTERVAL,
//       variant,
//     } = request
//     let lastTimestamp = since

//     const intervalId = setInterval(async () => {
//       try {
//         const data = await query({
//           priceUnit,
//           since: lastTimestamp,
//           timeframe,
//           variant,
//         })

//         if (data.length) {
//           lastTimestamp = data[data.length - 1].timestamp
//           data.forEach(onNewData)
//         }
//       } catch (error) {
//         onError(error)
//       }
//     }, pollingInterval)

//     return function cleanup() {
//       clearInterval(intervalId)
//     }
//   }
// }
