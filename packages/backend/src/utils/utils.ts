import {
  Blockchain,
  ChartData,
  Exchange,
  Platform,
  ProgressCallback,
  ProgressLog,
  ResolutionString,
  Time,
  Timestamp,
} from "src/interfaces"

import { PlatformPrefix } from "../settings/platforms"
import { formatDate } from "./formatting-utils"

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {String}    A string hash
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 * @see https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
 * @see https://devdocs.io/openjdk~8/java/lang/string#hashCode--
 */
export function hashString(str: string): string {
  let hash = 0
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash + chr) >>> 0 // Convert to 32bit unsigned integer
  }
  return hash.toString()
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function noop() {}

/**
 * Generates a UUID v4 string with fallback for environments where crypto.randomUUID is not available
 * @returns {string} A UUID v4 string
 */
export function randomUUID(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback implementation for older browsers/environments
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const num = parseInt(c, 10)
    const randomValue =
      typeof window !== "undefined" && window.crypto?.getRandomValues
        ? window.crypto.getRandomValues(new Uint8Array(1))[0]
        : typeof crypto !== "undefined" && crypto.getRandomValues
          ? crypto.getRandomValues(new Uint8Array(1))[0]
          : Math.floor(Math.random() * 256)
    return (num ^ (randomValue & (15 >> (num / 4)))).toString(16)
  })
}

export async function sleep(interval: number) {
  return new Promise((resolve) => setTimeout(resolve, interval))
}

export async function wasteCpuCycles(interval: number) {
  const end = performance.now() + interval
  while (performance.now() < end) {
    Math.sqrt(Math.random())
  }
}

/**
 * Converts a minutes interval to a valid cron expression (if it evenly divides 60, 1440, or 60).
 * @param {number} minutes - The interval in minutes
 * @return {string} A valid cron expression
 */
export function getCronExpression(minutes: number): string {
  if (minutes <= 0) {
    throw new Error("Minutes must be greater than 0")
  }

  // If it's an exact number of days
  if (minutes % 1440 === 0) {
    const days = minutes / 1440
    return `0 0 */${days} * *`
  }

  // If it's an exact number of hours (but less than a day)
  if (minutes % 60 === 0) {
    const hours = minutes / 60
    return `0 */${hours} * * *`
  }

  // If it's less than 60 minutes
  if (minutes < 60) {
    return `*/${minutes} * * * *`
  }

  // Otherwise, a strictly "every N minutes" schedule cannot be represented
  // by a single standard cron line. Throw to let caller know.
  throw new Error(
    `Interval must evenly divide 60 or 1440 (i.e. a whole number of hours or days). Received: ${minutes}`
  )
}

export function timeQueue<T extends (...args: never[]) => void>(
  this: unknown,
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const queue: (() => void)[] = []
  let timerId: ReturnType<typeof setInterval> | null = null

  function processQueue() {
    if (queue.length === 0) {
      if (timerId !== null) {
        clearInterval(timerId)
        timerId = null
      }
    } else {
      const call = queue.shift()
      call?.()
    }
  }

  return function (this: unknown, ...args: Parameters<T>) {
    queue.push(() => func.apply(this, args))

    if (timerId === null) {
      timerId = setInterval(processQueue, delay)
    }
  }
}

export * from "./environment-utils"

export function parseProgressLog(logEntry: string): ProgressLog {
  const isoDate = logEntry.slice(0, 24)
  const timestamp = new Date(isoDate).getTime()
  const progressUpdate = JSON.parse(logEntry.slice(25))
  return [timestamp, progressUpdate] satisfies ProgressLog
}

export const isExchange = (x: Platform): x is Exchange => x.id.startsWith(PlatformPrefix.Exchange)
export const isBlockchain = (x: Platform): x is Blockchain => x.id.startsWith(PlatformPrefix.Chain)

export function getBucketSize(timeInterval: ResolutionString): Time {
  timeInterval = timeInterval.toUpperCase() as ResolutionString

  // Seconds
  if (timeInterval === "1S") return 1

  // Minutes
  if (timeInterval === "1") return 60
  if (timeInterval === "3") return 180
  if (timeInterval === "5") return 300
  if (timeInterval === "15") return 900
  if (timeInterval === "30") return 1800

  // Hours
  if (timeInterval === "60") return 3600
  if (timeInterval === "120") return 7200
  if (timeInterval === "240") return 14400

  // Days/Weeks/Months
  if (timeInterval === "1D") return 86400
  if (timeInterval === "3D") return 3 * 86400
  if (timeInterval === "1W") return 604800
  if (timeInterval === "1M") return 2592000

  throw new Error(`Unsupported time interval: ${timeInterval}`)
}

export function approximateTime(time: Time, timeInterval: ResolutionString) {
  const bucketSize = getBucketSize(timeInterval)
  const remainder = time % bucketSize
  return remainder > bucketSize / 2 ? time - remainder + bucketSize : time - remainder
}

export function floorTimestamp(timestamp: Timestamp, timeInterval: ResolutionString) {
  const bucketSize = getBucketSize(timeInterval) * 1000
  const remainder = timestamp % bucketSize
  return timestamp - remainder
}

export function roundTimestamp(timestamp: Timestamp, timeInterval: ResolutionString) {
  const bucketSize = getBucketSize(timeInterval) * 1000
  const remainder = timestamp % bucketSize
  if (remainder > bucketSize / 2) return timestamp - remainder + bucketSize
  return timestamp - remainder
}

export function ensureValidBuckets(
  prices: ChartData[],
  timeInterval: ResolutionString
): ChartData[] {
  const bucketSize = getBucketSize(timeInterval)
  const patched: ChartData[] = []

  let prevRecord: ChartData | undefined
  for (let i = 0; i < prices.length; i++) {
    const record = prices[i]

    const intervalsDiff = prevRecord ? (record.time - (prevRecord.time as number)) / bucketSize : 0

    if (intervalsDiff > 1) {
      // fill the gaps between data points
      for (let i = 1; i < intervalsDiff; i++) {
        const gapTime = ((prevRecord as ChartData).time as number) + i * bucketSize
        patched.push({
          time: gapTime as Time,
          value: (prevRecord as ChartData).value,
        })
      }
    }

    patched.push(record)
    prevRecord = record
  }

  return patched
}

/**
 * Generic pagination utility for price APIs that handle time-based pagination.
 * Automatically splits requests that exceed the page limit into multiple requests.
 *
 * @param options Configuration for pagination
 * @returns Object containing validSince timestamp and previousPage data
 */
export async function paginatePriceRequest<T>(options: {
  bucketSizeInMs: number
  limit: number
  pageLimit: number
  queryFn: (since: number, until: number, limit: number) => Promise<T[]>
  since: number
  until: number
}): Promise<{ previousPage: T[]; validSince: number }> {
  const { since, until, limit, pageLimit, bucketSizeInMs, queryFn } = options

  let validSince = since
  let previousPage: T[] = []

  if (since && until) {
    const records = Math.floor((until - since) / bucketSizeInMs)
    if (records > pageLimit) {
      validSince = until - pageLimit * bucketSizeInMs
      previousPage = await queryFn(since, validSince, limit - pageLimit)
    }
  }

  return { previousPage, validSince }
}

interface PaginateParams<T> {
  /**
   * @default 10
   */
  concurrency?: number
  /**
   * Interval between pages
   * @default 0
   */
  cooldown?: number
  debugMode?: boolean
  fn: (start: Timestamp, end: Timestamp) => Promise<T[]>
  progress?: ProgressCallback
  signal?: AbortSignal
  since: Timestamp
  until: Timestamp
  window: number
}

export async function paginate<T>(params: PaginateParams<T>): Promise<T[]> {
  const {
    since,
    until,
    window,
    concurrency = 10,
    fn,
    progress = noop,
    signal,
    cooldown,
    debugMode,
  } = params

  const pages: (() => Promise<T[]>)[] = []
  const data: T[] = []

  for (let start = since; start <= until; start += window) {
    const end = Math.min(start + window, until)

    pages.push(async () => {
      if (signal?.aborted) throw new Error(signal.reason)
      // await progress([undefined, `Fetching ${formatDate(start)} - ${formatDate(end)}`])
      try {
        const result = await fn(start, end)
        if (debugMode) {
          await progress([
            undefined,
            `Fetched ${result.length} records from ${formatDate(start)} - ${formatDate(end)}`,
          ])
        }
        return result
      } catch (error) {
        if (String(error).includes("429")) throw error
        if (debugMode) {
          await progress([
            undefined,
            `Warn: skipping ${formatDate(start)} to ${formatDate(end)}. ${String(error)}`,
          ])
        }
        return []
      }
    })
  }

  for (let i = 0; i < pages.length; i += concurrency) {
    if (i && cooldown) await sleep(cooldown)

    const page = pages.slice(i, i + concurrency)
    const results = await Promise.all(page.map((x) => x()))
    for (const result of results) {
      data.push(...result)
    }
  }
  await progress([undefined, `Fetched ${data.length} records`])

  return data
}

interface PaginateExactParams<T> {
  /**
   * @default 10
   */
  concurrency?: number
  /**
   * Interval between pages
   * @default 0
   */
  cooldown?: number
  count: number
  debugMode?: boolean
  fn: (index: number) => Promise<T[]>
  progress?: ProgressCallback
  signal?: AbortSignal
}

export async function paginateExact<T>(params: PaginateExactParams<T>): Promise<T[]> {
  const { count, concurrency = 10, fn, progress = noop, signal, cooldown, debugMode } = params

  const pages: (() => Promise<T[]>)[] = []
  const data: T[] = []

  for (let i = 0; i < count; i++) {
    pages.push(async () => {
      if (signal?.aborted) throw new Error(signal.reason)
      try {
        const result = await fn(i)
        return result
      } catch (error) {
        if (String(error).includes("429")) throw error
        if (debugMode) {
          await progress([undefined, `Warn: skipping ${i}. ${String(error)}`])
        }
        return []
      }
    })
  }

  for (let i = 0; i < pages.length; i += concurrency) {
    if (i && cooldown) await sleep(cooldown)

    const page = pages.slice(i, i + concurrency)
    const results = await Promise.all(page.map((x) => x()))
    for (const result of results) {
      data.push(...result)
    }
  }
  await progress([undefined, `Fetched ${data.length} records`])

  return data
}
