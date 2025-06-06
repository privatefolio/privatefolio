import { ChartData, CoinbaseBucket, QueryRequest, ResolutionString, Time } from "src/interfaces"
import { PriceApiId, WETH_ASSET_ID } from "src/settings/settings"
import { getAssetTicker } from "src/utils/assets-utils"

export const Identifier: PriceApiId = "coinbase"

export function getPair(assetId: string) {
  if (assetId === WETH_ASSET_ID) return "ETH-USD"
  return `${getAssetTicker(assetId)}-USD`
}

// Coinbase only allows 300 records per request
const pageLimit = 300

// https://docs.cloud.coinbase.com/exchange/docs/apis/get-product-candles#details
// The granularity field must be one of the following values: {60, 300, 900, 3600, 21600, 86400}.
// Otherwise, your request will be rejected. These values correspond to timeslices representing one minute,
// five minutes, fifteen minutes, one hour, six hours, and one day, respectively.
function getInterval(timeInterval: ResolutionString) {
  if (timeInterval === "1m") return 60
  if (timeInterval === "1h") return 3600
  if (timeInterval === "1d") return 86400
  // if (timeInterval === "1w") return 604800

  throw new Error(`Timeframe '${timeInterval}' is not supported for this metric.`)
}

// https://docs.cloud.coinbase.com/exchange/reference/exchangerestapi_getproductcandles
// https://docs.cloud.coinbase.com/advanced-trade-api/reference/retailbrokerageapi_getcandles
export async function queryPrices(request: QueryRequest) {
  const { timeInterval, since, until, limit = 900, pair } = request
  const coinbaseInterval = getInterval(timeInterval)
  const timestampOffset = coinbaseInterval * 1000

  let apiUrl = `https://api.exchange.coinbase.com/products/${pair}/candles?granularity=${coinbaseInterval}`

  let validSince = since
  let previousBucketsPromise: Promise<CoinbaseBucket[]> = Promise.resolve([])

  if (since && until) {
    const records = (until - since) / timestampOffset
    if (records <= pageLimit) {
      validSince = since
    } else {
      validSince = until - timestampOffset * pageLimit
      previousBucketsPromise = queryPrices({
        limit: limit - pageLimit,
        pair,
        since,
        timeInterval,
        until: validSince,
      })
    }
  }

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

  const [res, previousBuckets] = await Promise.all([fetch(apiUrl), previousBucketsPromise])
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
  return previousBuckets.concat(buckets).slice(-limit)
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
