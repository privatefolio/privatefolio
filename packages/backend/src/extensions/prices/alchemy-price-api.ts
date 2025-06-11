import { ChartData, QueryRequest, ResolutionString, Time, Timestamp } from "../../interfaces"
import { PriceApiId } from "../../settings/settings"
import {
  getAssetContract,
  getAssetPlatform,
  getAssetTicker,
  isNativeAsset,
} from "../../utils/assets-utils"
import { isServer } from "../../utils/environment-utils"

export const Identifier: PriceApiId = "alchemy"

export function getPair(assetId: string) {
  const contract = getAssetContract(assetId)
  const platform = getAssetPlatform(assetId)
  const ticker = getAssetTicker(assetId)

  const isNative = isNativeAsset(contract)

  if (isNative) {
    return ticker
  }

  const network = getNetwork(platform)

  if (!network) {
    return ticker
  }

  return `${network}:${contract}`
}

function approximateTimestamp(timestamp: Time) {
  const remainder = timestamp % 86400
  return remainder > 43200 ? timestamp - remainder + 86400 : timestamp - remainder
}

function getInterval(timeInterval: ResolutionString) {
  if (timeInterval === "1m") return "5m" // closest to 1m
  if (timeInterval === "1h") return "1h"
  if (timeInterval === "1d") return "1d"
  return "1d" // default
}

function getNetwork(platform: string) {
  if (platform === "ethereum") return "eth-mainnet"
  if (platform === "arbitrum-one") return "arb-mainnet"
  if (platform === "optimistic-ethereum") return "opt-mainnet"
  if (platform === "base") return "base-mainnet"
  if (platform === "polygon-pos") return "polygon-mainnet"
  return ""
}

// Alchemy only allows 365 days of data per request when using the 1d interval
const pageLimit = 300

// https://www.alchemy.com/docs/data/prices-api/prices-api-endpoints/prices-api-endpoints/get-historical-token-prices
export async function queryPrices(request: QueryRequest) {
  const { timeInterval, limit = pageLimit, pair } = request

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

  // until & since always need to be set
  const now = Date.now()
  const today: Timestamp = now - (now % 86400000)

  const until = request.until || today
  const since = request.since || until - 86400000 * (limit || pageLimit)

  const apiKey = (isServer && process.env.ALCHEMY_API_KEY) || "BMARMYOT5kqVmbLXs_kz-"
  const apiUrl = `https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/historical`

  let validSince = since
  let previousPricesPromise: Promise<ChartData[]> = Promise.resolve([])

  if (since && until) {
    const days = (until - since) / (24 * 60 * 60 * 1000)
    if (days > pageLimit) {
      validSince = until - pageLimit * 24 * 60 * 60 * 1000
      previousPricesPromise = queryPrices({
        limit: limit - pageLimit,
        pair,
        since,
        timeInterval,
        until: validSince,
      })
    }
  }

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
    if (text.includes("Internal server error")) {
      throw new Error("Alchemy: NotFound")
    }
    throw new Error(`Alchemy: ${res.statusText} ${text}`)
  }

  const data = await res.json()
  const prices = (data.data || []).slice(-pageLimit)

  const patched: ChartData[] = []

  let prevRecord: ChartData | undefined
  for (let i = 0; i < prices.length; i++) {
    const time = approximateTimestamp(new Date(prices[i].timestamp).getTime() / 1000) as Time
    const value = parseFloat(prices[i].value)
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

  const [previousPrices] = await Promise.all([previousPricesPromise])
  return previousPrices.concat(patched).slice(0, limit)
}

export function mapToChartData(data: ChartData): ChartData {
  return data
}
