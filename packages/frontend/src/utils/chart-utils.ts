import { colors, Theme } from "@mui/material"
import {
  CandlestickSeriesPartialOptions,
  isBusinessDay,
  isUTCTimestamp,
  Time,
} from "lightweight-charts"
import { Currency } from "src/stores/device-settings-store"

import { TooltipPrimitiveOptions } from "../lightweight-charts/plugins/tooltip/tooltip"
import { formatNumber } from "./formatting-utils"
import { memoize } from "./fp-utils"

export const createPriceFormatter = memoize((currency: Currency) => {
  return (x: number) =>
    `${currency.symbol}${formatNumber(x)}`.replace(`${currency.symbol}-`, `-${currency.symbol}`)
})

export const createValueFormatter = memoize((currency: Currency, _isMobile: boolean) => {
  return (x: number) =>
    `${currency.symbol}${formatNumber(x, {
      // maximumFractionDigits: isMobile ? currency.significantDigits : currency.maxDigits,
      maximumFractionDigits: currency.significantDigits,
      minimumFractionDigits: currency.significantDigits,
    })}`.replace(`${currency.symbol}-`, `-${currency.symbol}`)
})

export const createNativeAmountFormatter = memoize((ticker: string) => {
  return (amountN: number) => {
    // let minimumFractionDigits: number | undefined
    // let maximumFractionDigits: number | undefined

    // // auto-adjust minimumFractionDigits
    // if (minimumFractionDigits === undefined && typeof amountN === "number") {
    //   if (amountN > 10_000 || amountN < -10_000) {
    //     minimumFractionDigits = 0
    //   } else if (amountN < 1 && amountN > -1) {
    //     minimumFractionDigits = Math.min(getMinimumDecimalPrecision(amountN), 6)
    //   }
    // }

    // // auto-adjust maximumFractionDigits
    // if (
    //   minimumFractionDigits !== undefined &&
    //   maximumFractionDigits === undefined &&
    //   typeof amountN === "number"
    // ) {
    //   if (amountN > 10_000 || amountN < -10_000) {
    //     maximumFractionDigits = Math.max(0, minimumFractionDigits)
    //   } else if (amountN < 1 && amountN > -1) {
    //     maximumFractionDigits = Math.max(minimumFractionDigits, getMinimumDecimalPrecision(amountN))
    //   } else {
    //     maximumFractionDigits = minimumFractionDigits
    //   }
    // }

    return `${formatNumber(amountN, {
      // maximumFractionDigits,
      // minimumFractionDigits,
    })} ${ticker}`
  }
})

export const profitColor = "rgb(0, 150, 108)"
// export const lossColor = "rgb(220, 60, 70)"
// export const profitColor = "rgb(51,215,120)"
// export const lossColor = "rgb(239, 83, 80)"
export const neutralColor = "rgb(128, 128, 128)"
// export const profitColor = colors.green[500]
export const lossColor = colors.red[500]

export const candleStickOptions: CandlestickSeriesPartialOptions = {
  // ----default
  // rgb(227, 96, 85)
  // rgb(72, 163, 154)
  // ----tv-mobile
  // rgb(229, 75, 74)
  // rgb(58, 151, 129)
  // ----tv-web
  // rgb(242, 54, 69)
  // rgb(8, 153, 129)
  //
  borderDownColor: lossColor, // #dc3c46
  borderUpColor: profitColor, // #00966c
  downColor: lossColor,
  upColor: profitColor,
  wickDownColor: lossColor,
  wickUpColor: profitColor,
}

export type CommonTooltipOptions = {
  backgroundColor: string
  borderColor: string
  color: string
  /**
   * @default false
   */
  compact: boolean
  /**
   * @default false
   */
  dateSecondary: boolean
  secondaryColor: string
  /**
   * @default true
   */
  showTime: boolean
}

export function extractTooltipColors(theme: Theme): Partial<TooltipPrimitiveOptions>["tooltip"] {
  if (theme.palette.mode === "dark") {
    return {
      backgroundColor: theme.palette.grey[200],
      borderColor: theme.palette.background.default,
      color: theme.palette.common.black,
      secondaryColor: theme.palette.grey[600],
    }
  }

  return {
    backgroundColor: theme.palette.grey[900],
    borderColor: theme.palette.background.default,
    color: theme.palette.common.white,
    secondaryColor: theme.palette.grey[400],
  }
}

export function getDate(time: Time): Date {
  if (isUTCTimestamp(time)) {
    return new Date(time * 1000)
  } else if (isBusinessDay(time)) {
    return new Date(time.year, time.month, time.day)
  } else {
    return new Date(time)
  }
}

export { aggregateCandles } from "privatefolio-backend/src/utils/data-utils"
