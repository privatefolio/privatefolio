import { ChartData, QueryRequest, ResolutionString, Time } from "../../interfaces"
import { PlatformPrefix } from "../../settings/config"
import { getAssetPlatform, getAssetTicker, getPlatformPrefix } from "../../utils/assets-utils"
import { floorTimestamp } from "../../utils/utils"

function mapInterval(interval: ResolutionString) {
  return interval.toLowerCase()
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

export type YahooCandle = {
  close?: number
  high?: number
  low?: number
  open?: number
  time: number
  volume?: number
}

export function mapToChartData(row: YahooCandle): ChartData {
  return {
    close: row.close,
    high: row.high,
    low: row.low,
    open: row.open,
    time: row.time,
    value: row.close ?? 0,
    volume: row.volume,
  }
}

export async function queryPrices(request: QueryRequest): Promise<YahooCandle[]> {
  const symbol = request.pair
  const interval = mapInterval(request.timeInterval)
  const period1 = request.since ? Math.floor(request.since / 1000) : undefined
  const period2 = request.until ? Math.floor(request.until / 1000) : undefined

  const params = new URLSearchParams()
  params.set("interval", interval)
  if (period1 !== undefined) params.set("period1", String(period1))
  if (period2 !== undefined) params.set("period2", String(period2))

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params.toString()}`

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Privatefolio/2.0 (hello@danielconstantin.net)",
    },
  })
  const json = await res.json()

  const result = json?.chart?.result?.[0]
  if (!result) {
    if (json?.chart?.error?.code) {
      throw new Error(`Yahoo: ${json.chart.error.code}`)
    }

    throw new Error("Yahoo: UnknownError")
  }

  const timeArray: Time[] = result.timestamp || []
  const quote = result.indicators?.quote?.[0] || {}
  const { close = [], high = [], low = [], open = [], volume = [] } = quote

  const candles: YahooCandle[] = timeArray.map((time, index) => ({
    close: close[index],
    high: high[index],
    low: low[index],
    open: open[index],
    time: floorTimestamp(time * 1000, request.timeInterval) / 1000,
    volume: volume[index],
  }))

  return candles.filter((c) => typeof c.close === "number")
}
