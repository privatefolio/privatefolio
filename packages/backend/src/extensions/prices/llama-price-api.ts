import { ChartData, LlamaPrice, QueryRequest, ResolutionString, Time } from "src/interfaces"
import { PriceApiId } from "src/settings/settings"
import { getAssetContract, getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"

import { approximateTimestamp, ensureValidBuckets } from "../../utils/utils"

export const Identifier: PriceApiId = "defi-llama"

export function getPair(assetId: string) {
  return `${getAssetPlatform(assetId)}:${getAssetContract(assetId)}`
}

export function getPairDescription(assetId: string) {
  const ticker = getAssetTicker(assetId)
  return [ticker, `${ticker} / US Dollar`]
}

// Strings accepted by period and searchWidth: Can use regular chart candle notion like ‘4h’ etc where: W = week, D = day, H = hour, M = minute (not case sensitive)
function getInterval(timeInterval: ResolutionString) {
  timeInterval = timeInterval.toUpperCase() as ResolutionString

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

  // Days/Weeks
  if (timeInterval === "1D") return "1d"
  if (timeInterval === "1W") return "1w"

  throw new Error(`DefiLlama does not support the '${timeInterval}' time interval.`)
}

// https://docs.llama.fi/coin-prices-api
// https://defillama.com/docs/api
export async function queryPrices(request: QueryRequest) {
  const { timeInterval, since, until, limit = 900, pair } = request

  let apiUrl = `https://coins.llama.fi/chart/${pair}?period=${getInterval(timeInterval)}&span=${limit}`

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
  if (!data) return []

  const prices = data.prices as LlamaPrice[]

  const patched = ensureValidBuckets(
    prices.map((price) => ({
      time: approximateTimestamp(price.timestamp, timeInterval) as Time,
      value: price.price,
    })),
    timeInterval
  )

  return patched
}

export function mapToChartData(data: ChartData): ChartData {
  return data
}
