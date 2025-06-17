import { getLivePricesForAsset } from "privatefolio-backend/build/src/extensions/prices/providers"
import { allPriceApiIds } from "privatefolio-backend/src/settings/price-apis"
import { ChartData, ResolutionString } from "src/interfaces"

import { $activeAccount } from "../../stores/account-store"
import { $rpc } from "../../workers/remotes"
import { Bar, IBasicDataFeed } from "./charting_library/charting_library"
import { toLibrarySymbol, toSearchSymbol } from "./pro-chart-utils"

const defaultPriceApiId = allPriceApiIds[0]

export function createCandleMapper() {
  return function customMapper(candle: ChartData): Bar {
    return {
      close: candle.close || candle.value,
      high: candle.high || candle.value,
      low: candle.low || candle.value,
      open: candle.open || candle.value,
      time: candle.time * 1000,
      volume: candle.volume,
    }
  }
}

export const datafeed: IBasicDataFeed = {
  getBars: async (symbolInfo, resolution, periodParams, onResult, onError) => {
    const { from: start, to: end } = periodParams

    if (!periodParams.firstDataRequest) {
      onResult([], {
        noData: true,
      })
      return
    }

    try {
      const assetId = symbolInfo.ticker!
      console.log("📜 LOG > getBars > assetId:", assetId, start, end, resolution.toLowerCase())

      const useDatabaseCache = false // asset.priceApiId === null && !!asset.priceApiId
      const rpc = $rpc.get()
      const activeAccount = $activeAccount.get()

      const candles = useDatabaseCache
        ? await rpc.getPricesForAsset(activeAccount, assetId, undefined, start, end)
        : await getLivePricesForAsset(
            assetId,
            defaultPriceApiId,
            300,
            resolution.toLowerCase() as ResolutionString
          ) // asset.priceApiId

      console.log("📜 LOG > getBars > candles:", candles.length)
      const parsed = candles.map(createCandleMapper())
      onResult(parsed as Bar[], {
        noData: true,
      })
    } catch (error: unknown) {
      console.log("📜 LOG > datafeed error", error)
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
            desc: "",
            name: "All",
            value: "",
          },
          // {
          //   desc: "https://protocol.fun",
          //   name: "Protofun",
          //   value: "Protofun",
          // },
          {
            desc: "https://binance.com",
            name: "Binance",
            value: "Binance",
          },
          {
            desc: "https://coinbase.com",
            name: "Coinbase",
            value: "Coinbase",
          },
        ],
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
            name: "Fundamental",
            value: "fundamental",
          },
        ],
      })
    }, 0)
  },
  resolveSymbol: (query, onResolve, onError) => {
    query = query.toLowerCase()
    console.log("📜 LOG > datafeed > resolveSymbol", query)

    setTimeout(async () => {
      const rpc = $rpc.get()
      const activeAccount = $activeAccount.get()

      const asset = await rpc.getAsset(activeAccount, query)
      if (asset) {
        console.log("📜 LOG > datafeed > resolved", query)

        onResolve(toLibrarySymbol(asset))
      } else {
        console.log("📜 LOG > datafeed > not resolved", query)
        onError(`Cannot find symbol ${query}`)
      }
    }, 0)
  },
  searchSymbols: async (userInput, exchange, symbolType, onResult) => {
    console.log("📜 LOG > datafeed > searchSymbols:", userInput, exchange, symbolType)
    userInput = userInput.toLowerCase()

    const rpc = $rpc.get()
    const assets = await rpc.findAssets(userInput, 100, true)
    const symbols = assets.map(toSearchSymbol)
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
  unsubscribeBars: (subscriberUID) => {
    console.log("📜 LOG >[unsubscribeBars]: Method call with subscriberUID:", subscriberUID)
  },
}
