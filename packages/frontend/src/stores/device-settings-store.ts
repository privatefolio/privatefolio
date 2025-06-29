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

const booleanTransformer = {
  decode: (value: string) => value === "true",
  encode: (value: boolean) => (value ? "true" : "false"),
}

export const $hideSmallBalances = persistentAtom<boolean>(
  "privatefolio-hide-small-balances",
  true,
  booleanTransformer
)

export const $hideUnlisted = persistentAtom<boolean>(
  "privatefolio-hide-unlisted-assets",
  true,
  booleanTransformer
)

export const $showQuotedAmounts = persistentAtom<boolean>(
  "privatefolio-show-quoted-amounts",
  true,
  booleanTransformer
)

export const $showRelativeTime = persistentAtom<boolean>(
  "privatefolio-show-relative-time",
  true,
  booleanTransformer
)

export const $hideUnsupportedPlatforms = persistentAtom<boolean>(
  "privatefolio-hide-unsupported-platforms",
  false,
  booleanTransformer
)

export const $hideInactiveConnections = persistentAtom<boolean>(
  "privatefolio-hide-inactive-connections",
  true,
  booleanTransformer
)

export const $hideSpam = persistentAtom<boolean>("privatefolio-hide-spam", true, booleanTransformer)
