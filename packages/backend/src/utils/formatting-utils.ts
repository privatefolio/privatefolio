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
  let e = 1
  let p = 0
  while (Math.round(num * e) / e !== num) {
    e *= 10
    p++
  }
  return p
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
