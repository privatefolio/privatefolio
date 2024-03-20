import { UTCTimestamp } from "lightweight-charts"

import { ChartData, PlatformId, QueryRequest, ResolutionString } from "../../../interfaces"

export interface PriceData {
  id?: string
  permawebTx: string
  provider: string
  source?: string
  symbol: string
  timestamp: number
  value: number
}

export const Identifier: PlatformId = "ethereum"

export function getPair(assetId: string) {
  const parts = assetId.split(":")
  return parts[2] // symbol only
}

function getInterval(timeInterval: ResolutionString) {
  if (timeInterval === "1m") return 60_000
  if (timeInterval === "1h") return 3_600_000
  if (timeInterval === "1d") return 86_400_000
  // if (timeInterval === "1w") return 604800

  throw new Error(`Timeframe '${timeInterval}' is not supported for this metric.`)
}

const BASE_API_URL = "https://api.redstone.finance"
const ENDPOINT = "prices"

// https://api.docs.redstone.finance/
export async function queryPrices(request: QueryRequest) {
  const { timeInterval, since, until, limit = 900, pair: symbol } = request

  const interval = since === until ? undefined : String(getInterval(timeInterval))

  const params = new URLSearchParams({
    limit: String(limit),
    provider: "redstone",
    symbol,
  })

  if (interval) {
    params.set("interval", interval)
  }
  if (since) {
    params.set("fromTimestamp", String(since))
  }
  if (until) {
    params.set("toTimestamp", String(until))
  }

  const apiUrl = `${BASE_API_URL}/${ENDPOINT}?${params}`

  try {
    const res = await fetch(apiUrl)

    // if its an error, html will be returned
    if (res.headers["Content-Type"] === "text/html") {
      const data = await res.text()
      throw new Error(data)
    }

    const data = await res.json()

    return data as PriceData[]
  } catch (error) {
    throw new Error(`Failed to fetch prices from Redstone API: ${error}`)
  }
}

export function mapToChartData(data: PriceData): ChartData {
  return {
    time: (data.timestamp / 1000) as UTCTimestamp,
    value: data.value,
  }
}
