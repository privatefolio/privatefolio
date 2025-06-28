import { persistentAtom, persistentMap } from "@nanostores/persistent"
import { computed } from "nanostores"

import { $activeAccount } from "./account-store"

export const DEFAULT_SIGNIFICANT_DIGITS = 2

export interface Currency {
  id: string
  logo?: string
  maxDigits: number
  name: string
  significantDigits: number
  symbol: string
}

export const DEFAULT_CURRENCIES_MAP: Record<string, Currency> = {
  BTC: {
    id: "BTC",
    maxDigits: 8,
    name: "Bitcoin",
    significantDigits: 5,
    symbol: "₿", // ฿
  },
  ETH: {
    id: "ETH",
    maxDigits: 6,
    name: "Ether",
    significantDigits: 3,
    symbol: "Ξ",
  },
  EUR: {
    id: "EUR",
    maxDigits: 2,
    name: "Euro",
    significantDigits: 0,
    symbol: "€",
  },
  USD: {
    id: "USD",
    maxDigits: 2,
    name: "US Dollar",
    significantDigits: 0,
    symbol: "$",
  },
}

export const $quoteCurrencyMap = persistentMap<Record<string, string | undefined>>(
  "privatefolio-quote-currency",
  {}
)

export const $quoteCurrency = computed(
  [$activeAccount, $quoteCurrencyMap],
  (activeAccount, quoteCurrencyMap) => {
    const quoteCurrencyId = quoteCurrencyMap[activeAccount]
    return typeof quoteCurrencyId === "string"
      ? DEFAULT_CURRENCIES_MAP[quoteCurrencyId]
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

export const $hideUnlistedMap = persistentMap<Record<string, string | undefined>>(
  "privatefolio-unlisted-assets",
  {}
)

export const $hideUnlisted = computed(
  [$activeAccount, $hideUnlistedMap],
  (activeAccount, hideUnlistedMap) => {
    const val = hideUnlistedMap[activeAccount]
    return typeof val === "string" ? val === "true" : true
  }
)

export const $showQuotedAmounts = persistentAtom<boolean>(
  "privatefolio-show-quoted-amounts",
  true,
  {
    decode: (value) => value === "true",
    encode: (value) => (value ? "true" : "false"),
  }
)

export const $showRelativeTime = persistentAtom<boolean>("privatefolio-show-relative-time", true, {
  decode: (value) => value === "true",
  encode: (value) => (value ? "true" : "false"),
})

export const $showSupportedPlatformsOnly = persistentAtom<boolean>(
  "privatefolio-show-supported-platforms-only",
  false,
  {
    decode: (value) => value === "true",
    encode: (value) => (value ? "true" : "false"),
  }
)

// TODO9 transform into map
export const $showActiveConnectionsOnly = persistentAtom<boolean>(
  "privatefolio-show-active-connections-only",
  true,
  {
    decode: (value) => value === "true",
    encode: (value) => (value ? "true" : "false"),
  }
)
