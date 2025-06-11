import { ChartData, LlamaPrice, QueryRequest, Time } from "src/interfaces"
import { PriceApiId } from "src/settings/settings"
import { getAssetContract, getAssetPlatform } from "src/utils/assets-utils"

export const Identifier: PriceApiId = "defi-llama"

export function getPair(assetId: string) {
  return `${getAssetPlatform(assetId)}:${getAssetContract(assetId)}`
}

function approximateTimestamp(timestamp: Time) {
  const remainder = timestamp % 86400
  return remainder > 43200 ? timestamp - remainder + 86400 : timestamp - remainder
}

// https://docs.llama.fi/coin-prices-api
// https://defillama.com/docs/api
export async function queryPrices(request: QueryRequest) {
  const { timeInterval, since, until, limit = 900, pair } = request

  let apiUrl = `https://coins.llama.fi/chart/${pair}?period=${timeInterval}&span=${limit}`

  if (since && until) {
    apiUrl = `${apiUrl}&start=${Math.floor(since / 1000)}`
    // llama throws if both flags are provided
    // apiUrl = `${apiUrl}&end=${until / 1000}`
  }

  const res = await fetch(apiUrl)

  /**
   *
   * @example
   *
   * ```json
   * {
   *   "coins": {
   *     "ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {
   *        "symbol": "WETH",
   *        "confidence": 0.99,
   *        "decimals": 18,
   *        "prices": [
   *          {
   *          "timestamp": 1706538317,
   *          "price": 2249.34
   *          }
   *        ]
   *      }
   *    }
   * }
   * ```
   */
  const { coins } = await res.json()

  const data = coins[pair]

  if (!data) {
    return []
  }

  const prices = data.prices as LlamaPrice[]

  const patched: ChartData[] = []

  let prevRecord: ChartData | undefined
  for (let i = 0; i < prices.length; i++) {
    const time = approximateTimestamp(prices[i].timestamp) as Time
    const value = prices[i].price
    const record = { time, value }

    const daysDiff = prevRecord ? (record.time - (prevRecord.time as number)) / 86400 : 0

    if (daysDiff > 1) {
      // fill the daily gaps
      for (let i = 1; i < daysDiff; i++) {
        const gapDay = ((prevRecord as ChartData).time as number) + i * 86400
        patched.push({
          time: gapDay as Time,
          value: (prevRecord as ChartData).value,
        })
      }
    }

    patched.push(record)
    prevRecord = record
  }

  return patched
}

export function mapToChartData(data: ChartData): ChartData {
  return data
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
