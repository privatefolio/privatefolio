import { colors, Theme } from "@mui/material"
import {
  CandlestickSeriesPartialOptions,
  isBusinessDay,
  isUTCTimestamp,
  Time,
} from "lightweight-charts"
import { ChartData, ResolutionString } from "src/interfaces"
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

function aggregateByWeeks(data: ChartData[]): ChartData[] {
  const aggregatedData: ChartData[] = []
  let previousWeekClose: number | undefined

  // Map to group data points by week starting on Monday
  const weeksMap = new Map<number, ChartData[]>()

  data.forEach((d) => {
    const date = new Date(d.time * 1000) // Convert timestamp (in seconds) to Date
    const day = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate the date of the Monday for the current week
    const diffToMonday = (day + 6) % 7 // Days to subtract to get to Monday
    const monday = new Date(date)
    monday.setDate(date.getDate() - diffToMonday)
    monday.setHours(0, 0, 0, 0) // Set time to midnight
    const mondayTimestamp = Math.floor(monday.getTime() / 1000) // Timestamp in seconds

    if (!weeksMap.has(mondayTimestamp)) {
      weeksMap.set(mondayTimestamp, [])
    }
    weeksMap.get(mondayTimestamp)!.push(d)
  })

  // Sort the weeks by their start time to ensure consistent ordering
  const sortedWeekKeys = Array.from(weeksMap.keys()).sort((a, b) => a - b)

  // Iterate over each week to calculate aggregated data
  for (const weekStart of sortedWeekKeys) {
    const weekData = weeksMap.get(weekStart)!

    // Sort the week's data by time to ensure correct open and close values
    weekData.sort((a, b) => a.time - b.time)

    const open = previousWeekClose !== undefined ? previousWeekClose : weekData[0]?.value
    const close = weekData[weekData.length - 1]?.value
    const low = Math.min(...weekData.map((d) => d.value))
    const high = Math.max(...weekData.map((d) => d.value))

    const weekCandle: ChartData = {
      close,
      high,
      low,
      open,
      time: weekStart, // Timestamp of the Monday of the week
      value: close,
    }
    previousWeekClose = close
    aggregatedData.push(weekCandle)
  }

  return aggregatedData
}

function aggregateByDays(data: ChartData[], interval: ResolutionString): ChartData[] {
  const days = parseInt(interval, 10)
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error(`Invalid aggregation period: ${String(interval)}`)
  }

  const aggregatedData: ChartData[] = []
  let previousPeriodClose: number | undefined

  const SECONDS_PER_DAY = 24 * 60 * 60
  const periodSeconds = days * SECONDS_PER_DAY

  // Group datapoints in buckets keyed by period start timestamp (UTC, in seconds)
  const periodMap = new Map<number, ChartData[]>()

  for (const d of data) {
    const bucketStart = Math.floor(d.time / periodSeconds) * periodSeconds
    if (!periodMap.has(bucketStart)) {
      periodMap.set(bucketStart, [])
    }
    periodMap.get(bucketStart)!.push(d)
  }

  const sortedKeys = Array.from(periodMap.keys()).sort((a, b) => a - b)

  for (const bucketStart of sortedKeys) {
    const bucket = periodMap.get(bucketStart)!
    // Ensure chronological order to compute open/close
    bucket.sort((a, b) => a.time - b.time)

    const close = bucket[bucket.length - 1]!.value
    const low = Math.min(...bucket.map((d) => d.value))
    const high = Math.max(...bucket.map((d) => d.value))
    const open = previousPeriodClose !== undefined ? previousPeriodClose : bucket[0]!.value

    const candle: ChartData = {
      close,
      high,
      low,
      open,
      time: bucketStart,
      value: close,
    }

    aggregatedData.push(candle)
    previousPeriodClose = close
  }

  return aggregatedData
}

function aggregateByMonths(data: ChartData[], interval: ResolutionString): ChartData[] {
  const months = parseInt(interval, 10)
  if (!Number.isFinite(months) || months <= 0) {
    throw new Error(`Invalid aggregation period: ${String(interval)}`)
  }

  const buckets = new Map<number, ChartData[]>()

  for (const d of data) {
    const date = new Date(d.time * 1000) // seconds → Date
    const monthIndex = date.getUTCFullYear() * 12 + date.getUTCMonth()
    const groupIndex = Math.floor(monthIndex / months)

    const startMonthIndex = groupIndex * months
    const startYear = Math.floor(startMonthIndex / 12)
    const startMonth = startMonthIndex % 12
    const bucketStart = Date.UTC(startYear, startMonth, 1, 0, 0, 0) / 1000 // seconds

    if (!buckets.has(bucketStart)) buckets.set(bucketStart, [])
    buckets.get(bucketStart)!.push(d)
  }

  const out: ChartData[] = []
  let prevClose: number | undefined

  for (const t of [...buckets.keys()].sort((a, b) => a - b)) {
    const bucket = buckets.get(t)!.sort((a, b) => a.time - b.time)

    const close = bucket[bucket.length - 1]!.value
    const low = Math.min(...bucket.map((d) => d.value))
    const high = Math.max(...bucket.map((d) => d.value))
    const open = prevClose ?? bucket[0]!.value

    out.push({ close, high, low, open, time: t, value: close })
    prevClose = close
  }

  return out
}

export function aggregateCandles(data: ChartData[], interval: ResolutionString): ChartData[] {
  if (interval === "1d") return data
  if (interval.includes("w")) return aggregateByWeeks(data)
  if (interval.includes("m")) return aggregateByMonths(data, interval)
  return aggregateByDays(data, interval)
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
