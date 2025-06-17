import { PAIR_MAPPER } from "privatefolio-backend/src/extensions/prices/providers"
import { MyAsset, ResolutionString } from "src/interfaces"
import { PRICE_APIS_META } from "src/settings"
import { getAssetTicker } from "src/utils/assets-utils"
import { candleStickOptions } from "src/utils/chart-utils"
import { resolveUrl } from "src/utils/utils"

import { LibrarySymbolInfo, SearchSymbolResultItem } from "./charting_library/charting_library"

export function toSearchSymbol(asset: MyAsset): SearchSymbolResultItem {
  const name = asset.name || asset.symbol
  const priceApiId = asset.priceApiId || "coinbase"
  const exchange = PRICE_APIS_META[priceApiId]
  const pairMapper = PAIR_MAPPER[priceApiId]
  const pair = pairMapper(asset.id)

  const result: SearchSymbolResultItem = {
    description: `${name} / US Dollar`,
    exchange: exchange.name,
    exchange_logo: resolveUrl(exchange.logoUrl),
    full_name: name,
    logo_urls: asset.logoUrl ? [asset.logoUrl] : undefined,
    symbol: pair,
    ticker: asset.id,
    type: "spot crypto",
  }

  return result
}

export function toLibrarySymbol(asset: MyAsset): LibrarySymbolInfo {
  const ticker = getAssetTicker(asset.id)
  const priceApiId = asset.priceApiId || "coinbase"
  const exchange = PRICE_APIS_META[priceApiId]

  const priceScale = 100 // Default scale for price display
  const minMove = 100 / priceScale

  const result: LibrarySymbolInfo = {
    ...toSearchSymbol(asset),
    currency_code: "USD",
    data_status: "streaming",
    format: "price",
    has_daily: true,
    has_intraday: true,
    has_weekly_and_monthly: true,
    industry: "Blockchain",
    listed_exchange: exchange.name,
    minmov: minMove,
    name: ticker,
    pricescale: priceScale,
    session: "24x7",
    supported_resolutions: ["1", "60", "1D", "1W", "1M"] as ResolutionString[],
    timezone: "Etc/UTC",
    visible_plots_set: "ohlcv",
    volume_precision: 8,
  }

  return result
}

export const CHART_DATA_KEY = "PRO_CHART_DATA"

export const saveChartData = (state: object) => {
  window.localStorage.setItem(CHART_DATA_KEY, JSON.stringify(state))
}

export const loadChartData = () => {
  const rawChartData = window.localStorage.getItem(CHART_DATA_KEY)

  if (!rawChartData) return

  const chartData = JSON.parse(rawChartData)

  // FIXME first time user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData.charts.forEach((chart: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chart.panes.forEach((pane: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pane.sources.forEach((source: any) => {
        if (source.type === "study_Volume") {
          source.state.palettes.volumePalette.colors = {
            "0": {
              color: candleStickOptions.downColor,
              style: 0,
              width: 1,
            },
            "1": {
              color: candleStickOptions.upColor,
              style: 0,
              width: 1,
            },
          }
        }
      })
    })
  })

  return chartData
}
