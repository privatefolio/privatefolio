import chalk from "chalk"
import {
  Blockchain,
  ChartData,
  Exchange,
  Platform,
  ProgressLog,
  ResolutionString,
  Time,
  Timestamp,
} from "src/interfaces"

import { isBunWorker } from "./environment-utils"

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

export const SPRING_CONFIGS = {
  quick: { clamp: true, friction: 200, mass: 5, tension: 2000 },
  quicker: { clamp: true, friction: 200, mass: 5, tension: 3000 },
  slow: { clamp: true, friction: 200, mass: 5, tension: 1500 },
  ultra: { clamp: true, friction: 200, mass: 5, tension: 6000 },
  veryQuick: { clamp: true, friction: 200, mass: 5, tension: 4000 },
  verySlow: { clamp: true, friction: 200, mass: 50, tension: 250 },
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

export function getPrefix(accountName: string, isCron = false): string {
  if (isCron) return chalk.green(`[${accountName}]`)
  if (isBunWorker) return `[${accountName}]`

  return chalk.gray(`[${accountName}]`)
  // return `${isBunWorker ? "[writeApi]" : "[readApi] "} [${accountName}]`
  // return (
  //   chalk.bold.magenta(`[${accountName}]`) +
  //   (isBunWorker ? chalk.bold.yellow("[writeApi]") : chalk.bold.blue("[readApi]"))
  // )
}

export const isExchange = (x: Platform): x is Exchange => "coingeckoTrustScore" in x
export const isBlockchain = (x: Platform): x is Blockchain => !("coingeckoTrustScore" in x)

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
