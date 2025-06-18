import { getLivePricesForAsset } from "privatefolio-backend/build/src/extensions/prices/providers"
import {
  allPriceApiIds,
  PRICE_APIS_META,
  PriceApiId,
  SUPPORTED_RESOLUTIONS,
} from "privatefolio-backend/src/settings/price-apis"
import { ChartData } from "src/interfaces"

import { $activeAccount } from "../../stores/account-store"
import { $rpc } from "../../workers/remotes"
import { Bar, IBasicDataFeed, SearchSymbolResultItem } from "./charting_library/charting_library"
import {
  computeLimit,
  EXCHANGE_DELIMITER,
  toLibrarySymbol,
  toSearchSymbol,
} from "./pro-chart-utils"

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

    try {
      const limit = computeLimit(start, end, resolution)
      const [priceApiId, assetId] = symbolInfo.ticker!.split(EXCHANGE_DELIMITER)
      console.log(
        "📜 LOG > getBars > assetId:",
        assetId,
        start,
        end,
        resolution.toLowerCase(),
        priceApiId,
        limit
      )

      if (start <= 0) {
        onResult([], {
          noData: true,
        })
        return
      }

      const useDatabaseCache = false // asset.priceApiId === null && !!asset.priceApiId
      const rpc = $rpc.get()
      const activeAccount = $activeAccount.get()

      const candles = useDatabaseCache
        ? await rpc.getPricesForAsset(activeAccount, assetId, undefined, start, end)
        : await getLivePricesForAsset(
            assetId,
            priceApiId as PriceApiId,
            limit,
            resolution,
            start * 1000,
            end * 1000
          )

      console.log(
        "📜 LOG > getBars > candles:",
        candles.length,
        candles[0]?.time,
        candles[candles.length - 1]?.time
      )
      const parsed = candles.map(createCandleMapper())
      onResult(parsed as Bar[], {
        noData: parsed.length === 0,
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
    console.log("📜 LOG > datafeed > resolveSymbol", query)
    const [exchange, symbol] = query.split(EXCHANGE_DELIMITER)

    setTimeout(async () => {
      const rpc = $rpc.get()
      const activeAccount = $activeAccount.get()

      try {
        if (exchange === "privatefolio") {
          // const personalDataSymbol = getPersonalDataSymbol(symbol)
          // console.log("📜 LOG > setTimeout > personalDataSymbol:", personalDataSymbol)
          // if (personalDataSymbol) onResolve(personalDataSymbol)
        } else {
          const asset = await rpc.getAsset(activeAccount, symbol)
          if (asset) onResolve(toLibrarySymbol(asset, exchange as PriceApiId))
        }

        throw new Error(`Cannot find symbol ${query}`)
      } catch (error) {
        onError(error instanceof Error ? error.message : String(error))
      }
    }, 0)
  },
  searchSymbols: async (userInput, exchange, symbolType, onResult) => {
    console.log("📜 LOG > datafeed > searchSymbols:", userInput, exchange, symbolType)
    userInput = userInput.toLowerCase()

    const symbols: SearchSymbolResultItem[] = []

    // if (symbolType !== "spot crypto" && (exchange === "all" || exchange === "privatefolio")) {
    //   const personalDataSymbols = findPersonalDataSymbol(userInput, 100)
    //   symbols.push(...personalDataSymbols)
    // }

    const rpc = $rpc.get()
    const assets = await rpc.findAssets(userInput, 100, true)

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
