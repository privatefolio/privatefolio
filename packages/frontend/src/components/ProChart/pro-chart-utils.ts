/* eslint-disable @typescript-eslint/no-explicit-any */
import { PRICE_API_MATCHER } from "privatefolio-backend/src/extensions/prices/providers"
import { getBucketSize } from "privatefolio-backend/src/utils/utils"
import { MyAsset, ResolutionString } from "src/interfaces"
import { PRICE_APIS_META, PriceApiId } from "src/settings"
import { getAssetTicker } from "src/utils/assets-utils"
import { candleStickOptions } from "src/utils/chart-utils"
import { resolveUrl } from "src/utils/utils"

import {
  IChartingLibraryWidget,
  LibrarySymbolInfo,
  SearchSymbolResultItem,
} from "./charting_library/charting_library"

export const EXCHANGE_DELIMITER = "_"

export function toSearchSymbol(asset: MyAsset, priceApiId: PriceApiId): SearchSymbolResultItem {
  const name = asset.name || asset.symbol
  const exchange = PRICE_APIS_META[priceApiId]
  const priceApi = PRICE_API_MATCHER[priceApiId]
  const [pairShort, pairLong] = priceApi.getPairDescription(asset.id)

  const result: SearchSymbolResultItem = {
    description: pairLong,
    exchange: exchange.name,
    exchange_logo: resolveUrl(exchange.logoUrl),
    full_name: name,
    logo_urls: asset.logoUrl ? [asset.logoUrl] : undefined,
    symbol: pairShort,
    ticker: `${priceApiId}${EXCHANGE_DELIMITER}${asset.id}`,
    type: "spot crypto",
  }

  return result
}

export function toLibrarySymbol(asset: MyAsset, priceApiId: PriceApiId): LibrarySymbolInfo {
  const ticker = getAssetTicker(asset.id)
  const exchange = PRICE_APIS_META[priceApiId]

  const priceScale = 100 // Default scale for price display
  const minMove = 100 / priceScale

  const result: LibrarySymbolInfo = {
    ...toSearchSymbol(asset, priceApiId),
    currency_code: "USD",
    data_status: "streaming",
    format: "price",
    has_daily: true,
    has_intraday: true,
    has_seconds: true,
    has_weekly_and_monthly: true,
    industry: "Blockchain",
    listed_exchange: exchange.name,
    minmov: minMove,
    name: ticker,
    pricescale: priceScale,
    session: "24x7",
    supported_resolutions: exchange.supportedResolutions,
    timezone: "Etc/UTC",
    visible_plots_set: exchange.hasCandles ? "ohlcv" : "c",
    volume_precision: 8,
  }

  return result
}

export const CHART_DATA_KEY = "PRO_CHART_DATA"

export const removeChartData = () => {
  window.localStorage.removeItem(CHART_DATA_KEY)
}

export const saveChartData = (state: object) => {
  window.localStorage.setItem(CHART_DATA_KEY, JSON.stringify(state))
}

export const loadChartData = () => {
  const rawChartData = window.localStorage.getItem(CHART_DATA_KEY)

  if (!rawChartData) return

  const chartData = JSON.parse(rawChartData)

  chartData.charts.forEach((chart: any) => {
    chart.panes.forEach((pane: any) => {
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

export const resetWidget = (widget: IChartingLibraryWidget | null, defaultSymbol: string) => {
  if (!widget) return
  widget.activeChart().removeAllStudies()
  widget.activeChart().setChartType(3)
  widget.activeChart().setSymbol(defaultSymbol)
  widget.activeChart().createStudy("Volume", true)
}

export function computeLimit(start: number, end: number, resolution: ResolutionString) {
  const bucketSize = getBucketSize(resolution)
  const limit = Math.floor((end - start) / bucketSize)
  return limit
}
