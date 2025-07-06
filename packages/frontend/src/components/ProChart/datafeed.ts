import { getLivePricesForAsset } from "privatefolio-backend/build/src/extensions/prices/providers"
import {
  allPriceApiIds,
  PRICE_APIS_META,
  PriceApiId,
  SUPPORTED_RESOLUTIONS,
} from "privatefolio-backend/src/settings/price-apis"
import { ChartData } from "src/interfaces"
import { aggregateCandles } from "src/utils/chart-utils"

import { $activeAccount } from "../../stores/account-store"
import { $rpc } from "../../workers/remotes"
import { Bar, IBasicDataFeed, SearchSymbolResultItem } from "./charting_library/charting_library"
import {
  findPersonalDataSymbol,
  getPersonalDataSymbol,
  getPersonalSymbolChartData,
} from "./personal-data-symbols"
import {
  computeLimit,
  EXCHANGE_DELIMITER,
  toLibrarySymbol,
  toSearchSymbol,
} from "./pro-chart-utils"

export function mapChartDataToBars(candle: ChartData): Bar {
  return {
    close: candle.close || candle.value,
    high: candle.high || candle.value,
    low: candle.low || candle.value,
    open: candle.open || candle.value,
    time: candle.time * 1000,
    volume: candle.volume,
  }
}

export const datafeed: IBasicDataFeed = {
  getBars: async (symbolInfo, resolution, periodParams, onResult, onError) => {
    const { from: start, to: end } = periodParams

    try {
      const limit = computeLimit(start, end, resolution)
      const [exchange, id] = symbolInfo.ticker!.split(EXCHANGE_DELIMITER)
      // console.log("📜 LOG > getBars > assetId:", id, start, end, resolution, exchange, limit)

      if (start <= 0) {
        onResult([], { noData: true })
        return
      }

      const rpc = $rpc.get()
      const activeAccount = $activeAccount.get()

      if (exchange === "privatefolio") {
        if (!periodParams.firstDataRequest) {
          onResult([], { noData: true })
          return
        }
        const chartData = await getPersonalSymbolChartData(id, rpc, activeAccount)
        if (!chartData) {
          onError(`Unknown privatefolio symbol ${id}`)
          return
        }
        const data = aggregateCandles(chartData, resolution)
        const bars = data.map(mapChartDataToBars)
        onResult(bars, { noData: false })
        return

        // TODO5
        // rpc.getPricesForAsset(activeAccount, id, undefined, start, end)
        // const useDatabaseCache = false // asset.priceApiId === null && !!asset.priceApiId
      }

      const data = await getLivePricesForAsset(
        id,
        exchange as PriceApiId,
        limit,
        resolution,
        start * 1000,
        end * 1000
      )

      const bars = data.map(mapChartDataToBars)
      onResult(bars, { noData: bars.length === 0 })
    } catch (error: unknown) {
      console.error(error)
      onError(error instanceof Error ? error.message : String(error))
    }
  },
  onReady: (onReadyCallback) => {
    setTimeout(() => {
      onReadyCallback({
        // currency_codes: [
        //   { code: "USD", description: "$", id: "USD" },
        //   { code: "EUR", description: "€", id: "EUR" },
        // ],
        exchanges: [
          {
            desc: "All sources",
            name: "All",
            value: "all",
          },
          {
            desc: "https://privatefolio.xyz",
            name: "Privatefolio",
            value: "privatefolio",
          },
          ...allPriceApiIds.map((priceApiId) => ({
            desc: PRICE_APIS_META[priceApiId].url,
            name: PRICE_APIS_META[priceApiId].name,
            value: priceApiId,
          })),
        ],
        supported_resolutions: SUPPORTED_RESOLUTIONS,
        supports_time: true, // TODO8
        symbols_types: [
          {
            name: "All",
            value: "",
          },
          {
            name: "Asset price",
            value: "spot crypto",
          },
          {
            name: "Personal data",
            value: "personal data",
          },
        ],
      })
    }, 0)
  },
  resolveSymbol: (query, onResolve, onError) => {
    query = query.toLowerCase()
    const [exchange, id] = query.split(EXCHANGE_DELIMITER)

    setTimeout(async () => {
      const rpc = $rpc.get()
      const activeAccount = $activeAccount.get()

      try {
        if (exchange === "privatefolio") {
          const personalDataSymbol = getPersonalDataSymbol(id)
          if (personalDataSymbol) onResolve(personalDataSymbol)
        } else {
          const asset = await rpc.getAsset(activeAccount, id)
          if (asset) onResolve(toLibrarySymbol(asset, exchange as PriceApiId))
        }

        throw new Error(`Cannot find symbol ${query}`)
      } catch (error) {
        onError(error instanceof Error ? error.message : String(error))
      }
    }, 0)
  },
  searchSymbols: async (userInput, exchange, symbolType, onResult) => {
    userInput = userInput.toLowerCase()

    const symbols: SearchSymbolResultItem[] = []

    if (symbolType !== "spot crypto" && (exchange === "all" || exchange === "privatefolio")) {
      const personalDataSymbols = findPersonalDataSymbol(userInput, 100)
      symbols.push(...personalDataSymbols)
    }

    const rpc = $rpc.get()
    const assets = await rpc.findAssets($activeAccount.get(), userInput, 100, true)

    for (const asset of assets) {
      for (const priceApiId of allPriceApiIds) {
        if (exchange !== "all" && exchange !== priceApiId) continue
        if (!!symbolType && symbolType !== "spot crypto") continue
        const symbol = toSearchSymbol(asset, priceApiId)
        symbols.push(symbol)
      }
    }

    onResult(symbols)
  },
  subscribeBars: (
    _symbolInfo,
    _resolution,
    _onRealtimeCallback,
    _subscriberUID
    // onResetCacheNeededCallback
  ) => {
    // console.log("📜 LOG >[subscribeBars]: Method call with subscriberUID:", subscriberUID)
  },
  unsubscribeBars: (_subscriberUID) => {
    // console.log("📜 LOG >[unsubscribeBars]: Method call with subscriberUID:", subscriberUID)
  },
}
