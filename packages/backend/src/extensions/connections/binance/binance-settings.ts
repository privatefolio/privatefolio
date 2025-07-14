import { Timestamp } from "src/interfaces"

import { isServer, isWebWorker } from "../../../utils/utils"

export const BASE_URL =
  isServer && !isWebWorker ? "https://api.binance.com" : "http://localhost:8080/api.binance.com"

// TODO9
export const _90_DAYS = 7_776_000_000
export const _7_DAYS = 604_800_000
export const _30_DAYS = 2_592_000_000
export const _200_DAYS = 17_280_000_000

export const BINANCE_WALLET_IDS = [
  "coinFutures",
  "crossMargin",
  "isolatedMargin",
  "spot",
  "usdFutures",
] as const

export type BinanceWalletId = (typeof BINANCE_WALLET_IDS)[number]

export const BINANCE_WALLET_LABELS: Record<BinanceWalletId, string> = {
  coinFutures: "Coin-M Futures",
  crossMargin: "Cross Margin",
  isolatedMargin: "Isolated Margin",
  spot: "Spot",
  usdFutures: "USD-M Futures",
}

export const binanceConnExtension = "binance-connection"

export const FOUNDING_DATE: Timestamp = 1498867200000
