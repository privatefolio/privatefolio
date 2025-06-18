import { ResolutionString } from "src/interfaces"

import { LibrarySymbolInfo, SearchSymbolResultItem } from "./charting_library/charting_library"
import { EXCHANGE_DELIMITER } from "./pro-chart-utils"

// TODO9
const logoUrl = "https://privatefolio.xyz/privatefolio.svg"
const type = "personal data"
const exchange = "Privatefolio"

const PRIVATEFOLIO_SYMBOLS: SearchSymbolResultItem[] = [
  {
    description: "Portfolio networth in USD",
    exchange,
    exchange_logo: logoUrl,
    full_name: "Networth",
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
  const symbol = PRIVATEFOLIO_SYMBOLS.find((s) => s.symbol.toLowerCase() === id)
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
    supported_resolutions: ["1D", "1W"] as ResolutionString[],
    timezone: "Etc/UTC",
    visible_plots_set: "c",
    // visible_plots_set: hasCandles ? "ohlc" : "c",
    volume_precision: 8,
  }
}
