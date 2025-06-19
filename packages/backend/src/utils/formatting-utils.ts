import { Timestamp } from "src/interfaces"

const locale = typeof window !== "undefined" ? window.navigator.language : "en-US"

/**
 * Calculates the number of decimal places required to precisely represent the given number.
 *
 * This function multiplies the number by increasing powers of 10 until rounding the result
 * yields the original number, thereby determining the minimal precision required. If the number
 * is not finite (e.g., Infinity or NaN), the function returns 0.
 *
 * @param num - The number for which to determine the decimal precision.
 * @returns The number of decimal places required to exactly represent the number.
 *
 * @example
 * // Returns 2 because 3.14 has 2 decimal places.
 * getDecimalPrecision(3.14);
 *
 * @example
 * // Returns 0 because 42 is an integer.
 * getDecimalPrecision(42);
 */
export function getDecimalPrecision(num: number) {
  if (!isFinite(num)) return 0
  let exponent = 1
  let position = 0
  while (Math.round(num * exponent) / exponent !== num) {
    exponent *= 10
    position++
  }
  return position
}

/**
 * Returns the position of the first nonzero decimal digit.
 *
 * For example:
 * 0.005 -> returns 3
 * 0.1   -> returns 1
 * 1.23  -> returns 1 (first nonzero decimal is in the first place)
 * 42    -> returns 0 (no decimal part)
 *
 * @param num - The number to analyze.
 * @returns The position (1-based) of the first nonzero decimal digit.
 */
export function getMinimumDecimalPrecision(num: number): number {
  if (!isFinite(num) || Math.floor(Math.abs(num)) === Math.abs(num)) return 0
  let exponent = 1
  let position = 0
  while (true) {
    exponent *= 10
    position++
    const digit = Math.floor(Math.abs(num) * exponent) % 10
    if (digit !== 0) return position
  }
}

export function formatDuration(milliseconds: number, showMs = false) {
  const seconds = milliseconds / 1000

  if (seconds < 1 && showMs) {
    return `${milliseconds} ms`
  }

  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`
  }

  if (seconds < 3600) {
    return `${(seconds / 60).toFixed(2)}m`
  }

  return `${(seconds / 3600).toFixed(2)}h`
}

export function formatNumber(number: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat(locale, {
    notation: "standard",
    // roundingType: "significant", TODO1
    // minimumIntegerDigits: 2,
    ...opts,
  }).format(number)
}

export function asUTC(date: Date): Timestamp {
  return Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  )
}

export function parseEuropeanDateString(date: string) {
  const [datePart, timePart] = date.split(" ")
  const [day, month, year] = datePart.split(".")
  const [hours, minutes, seconds] = timePart.split(":")

  const utcDate = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours) - 1,
      Number(minutes),
      Number(seconds)
    )
  )

  return utcDate.getTime()
}

export function toUTCString(timestamp: number): string {
  return new Date(timestamp).toISOString().replace(/T/, " ").replace(/\..+/, "")
}

export function formatDate(date: Date | number) {
  try {
    return new Intl.DateTimeFormat(locale, {
      // dateStyle: "medium",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)
  } catch (error) {
    console.error(error)
    return "Invalid date"
  }
}

export function formatHour(date: Date | number, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    hour12: false,
    minute: "numeric",
    // second: "numeric",
    // fractionalSecondDigits: 3,
    ...opts,
  }).format(date)
}

export function formatDateWithHour(date: Date | number, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    hour: "numeric",
    hour12: false,
    minute: "numeric",
    month: "long",
    // second: "numeric",
    // timeZoneName: "short",
    year: "numeric",
    ...opts,
  }).format(date)
}

export function formatFileSize(bytes: number, longFormat = false) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = longFormat
    ? ["Bytes", "Kibibytes", "Mebibytes", "Gibibytes", "Tebibytes", "Pebibytes"]
    : ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${formatNumber(bytes / Math.pow(k, i), {
    maximumFractionDigits: longFormat ? undefined : 2,
  })} ${sizes[i]}`
}

export const ONE_DAY_TIME = 24 * 60 * 60
export const ONE_DAY = ONE_DAY_TIME * 1000

/**
 * Calculates appropriate minimumFractionDigits and maximumFractionDigits for formatting a number.
 *
 * @param x - The number to format
 * @param significantDigits - Optional override for minimumFractionDigits
 * @returns Object with minimumFractionDigits and maximumFractionDigits
 */
export function getAutoFormatDigits(
  x: number,
  significantDigits?: number
): { maximumFractionDigits?: number; minimumFractionDigits?: number } {
  let minimumFractionDigits = significantDigits
  let maximumFractionDigits: number | undefined

  // auto-adjust minimumFractionDigits
  if (minimumFractionDigits === undefined) {
    if (x > 10_000 || x < -10_000) {
      minimumFractionDigits = 0
    } else if (x > 1000 || x < -1000) {
      minimumFractionDigits = 2
    } else if (x < 1 && x > -1) {
      const max = getDecimalPrecision(x)
      const min = getMinimumDecimalPrecision(x)
      minimumFractionDigits = Math.min(min + 3, max)
    }
  }

  // auto-adjust maximumFractionDigits
  if (minimumFractionDigits !== undefined) {
    if (x > 10_000 || x < -10_000) {
      maximumFractionDigits = Math.max(0, minimumFractionDigits)
    } else if (x < 1 && x > -1) {
      const max = getDecimalPrecision(x)
      const min = getMinimumDecimalPrecision(x)
      maximumFractionDigits = Math.min(min + 3, max)
    } else {
      maximumFractionDigits = minimumFractionDigits
    }
  }

  // fail guard
  if (
    typeof minimumFractionDigits === "number" &&
    typeof maximumFractionDigits === "number" &&
    minimumFractionDigits > maximumFractionDigits
  ) {
    maximumFractionDigits = minimumFractionDigits
  }

  return { maximumFractionDigits, minimumFractionDigits }
}
