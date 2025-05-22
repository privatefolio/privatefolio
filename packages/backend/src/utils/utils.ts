import chalk from "chalk"
import { ProgressLog } from "src/interfaces"

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
 * Converts a minutes interval to a valid cron expression that works for any interval
 * @param {number} minutes - The interval in minutes
 * @return {string} A valid cron expression
 */
export function getCronExpression(minutes: number): string {
  if (minutes <= 0) {
    throw new Error("Minutes must be greater than 0")
  }

  if (minutes <= 60) {
    // If interval is 60 or less, we can use the standard minute syntax
    return `*/${minutes} * * * *`
  } else {
    // For intervals > 60 minutes, we need to run at specific hours
    // Calculate how many times per day and at which hours
    const hoursPerDay = 24
    const intervalsPerDay = Math.floor((hoursPerDay * 60) / minutes)

    if (intervalsPerDay <= 1) {
      // Run once per day at midnight
      return `0 0 * * *`
    } else {
      // For intervals that result in multiple runs per day
      const hourStep = Math.floor(hoursPerDay / intervalsPerDay)
      return `0 0/${hourStep} * * *`
    }
  }
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

export function getPrefix(accountName: string): string {
  return chalk.bold.magenta(`[${accountName}]`)
}
