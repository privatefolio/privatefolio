import { Timestamp } from "src/interfaces"

import { isServer, isWebWorker } from "../../../utils/utils"

export const BASE_URL =
  isServer && !isWebWorker ? "https://api.binance.com" : "http://localhost:8080/api.binance.com"

export const BINANCE_WALLET_IDS = [
  "coinFutures",
  "crossMargin",
  "isolatedMargin",
  "spot",
  "usdFutures",
] as const

export type BinanceWalletId = (typeof BINANCE_WALLET_IDS)[number]

/* eslint-disable sort-keys-fix/sort-keys-fix */
export const BINANCE_WALLETS: Record<BinanceWalletId, string> = {
  spot: "Binance Spot",
  crossMargin: "Binance Cross Margin",
  isolatedMargin: "Binance Isolated Margin",
  usdFutures: "Binance USD-M Futures",
  coinFutures: "Binance Coin-M Futures",
}
/* eslint-enable */

export const binanceConnExtension = "binance-connection"

export const FOUNDING_DATE: Timestamp = 1498867200000

export const BINANCE_REWARD_TYPES = ["REWARDS", "BONUS", "REALTIME"] as const
export type BinanceRewardType = (typeof BINANCE_REWARD_TYPES)[number]
