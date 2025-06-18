import { ResolutionString } from "src/interfaces"
import { resolveUrl } from "src/utils/utils"

import { LibrarySymbolInfo, SearchSymbolResultItem } from "./charting_library/charting_library"
import { EXCHANGE_DELIMITER } from "./pro-chart-utils"

const logoUrl = resolveUrl(`$STATIC_ASSETS/extensions/privatefolio.svg`)!
const type = "personal data"
const exchange = "Privatefolio"

const PRIVATEFOLIO_SYMBOLS: SearchSymbolResultItem[] = [
  {
    description: "Portfolio networth in USD",
    exchange,
    exchange_logo: logoUrl,
    full_name: "Portfolio networth",
    logo_urls: [logoUrl],
    symbol: "NETWORTH",
    ticker: `privatefolio${EXCHANGE_DELIMITER}NETWORTH`,
    type,
  },
]

export function findPersonalDataSymbol(query: string, limit = 100): SearchSymbolResultItem[] {
  return PRIVATEFOLIO_SYMBOLS.filter(
    (symbol) =>
      symbol.ticker?.toLowerCase().includes(query) ||
      symbol.description.toLowerCase().includes(query)
  ).slice(0, limit)
}

export function getPersonalDataSymbol(id: string): LibrarySymbolInfo | undefined {
  console.log("📜 LOG > getPersonalDataSymbol > ticker:", id)
  const symbol = PRIVATEFOLIO_SYMBOLS.find((s) => s.symbol.toLowerCase() === id)
  console.log("📜 LOG > getPersonalDataSymbol > symbol:", symbol)
  if (!symbol) return undefined

  const priceScale = 100 // Default scale for price display
  const minMove = 100 / priceScale

  return {
    ...symbol,
    currency_code: "USD",
    data_status: "streaming",
    format: "price",
    has_daily: true,
    has_intraday: true,
    has_seconds: true,
    has_weekly_and_monthly: true,
    industry: "Blockchain",
    listed_exchange: exchange,
    minmov: minMove,
    name: symbol.full_name,
    pricescale: priceScale,
    session: "24x7",
    supported_resolutions: ["1D"] as ResolutionString[],
    timezone: "Etc/UTC",
    visible_plots_set: "c",
    // visible_plots_set: exchange.hasCandles ? "ohlcv" : "c",
    volume_precision: 8,
  }
}
