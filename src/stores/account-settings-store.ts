import { persistentMap } from "@nanostores/persistent"
import { computed } from "nanostores"

import { $activeAccount } from "./account-store"

export const DEFAULT_SIGNIFICANT_DIGITS = 2

export interface Currency {
  logo?: string
  maxDigits: number
  id: string
  significantDigits: number
  symbol: string
}

export const DEFAULT_CURRENCIES_MAP: Record<string, Currency> = {
  BTC: {
    id: "BTC",
    maxDigits: 8,
    significantDigits: 5,
    symbol: "₿", // ฿
  },
  ETH: {
    id: "ETH",
    maxDigits: 6,
    significantDigits: 3,
    symbol: "Ξ",
  },
  EUR: {
    id: "EUR",
    maxDigits: 2,
    significantDigits: 0,
    symbol: "€",
  },
  USD: {
    id: "USD",
    maxDigits: 2,
    // name: "US Dollar"
    significantDigits: 0,
    symbol: "$",
  },
}

export const $baseCurrencyMap = persistentMap<Record<string, string | undefined>>(
  "privatefolio-base-currency",
  {}
)

export const $baseCurrency = computed(
  [$activeAccount, $baseCurrencyMap],
  (activeAccount, baseCurrencyMap) => {
    const baseCurrencyId = baseCurrencyMap[activeAccount]
    return typeof baseCurrencyId === "string"
      ? DEFAULT_CURRENCIES_MAP[baseCurrencyId]
      : DEFAULT_CURRENCIES_MAP.USD
  }
)

export const $hideSmallBalancesMap = persistentMap<Record<string, string | undefined>>(
  "privatefolio-small-balances",
  {}
)

export const $hideSmallBalances = computed(
  [$activeAccount, $hideSmallBalancesMap],
  (activeAccount, hideSmallBalancesMap) => {
    const val = hideSmallBalancesMap[activeAccount]
    return typeof val === "string" ? val === "true" : true
  }
)
