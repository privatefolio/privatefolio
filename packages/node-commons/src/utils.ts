import { existsSync, mkdirSync } from "fs"

/**
 * 1 day in minutes
 */
export const ONE_DAY_MIN = 24 * 60

/**
 * 1 day in seconds
 */
export const ONE_DAY_TIME = ONE_DAY_MIN * 60

/**
 * 1 day in milliseconds
 */
export const ONE_DAY = ONE_DAY_TIME * 1000

/**
 * 1 hour in milliseconds
 */
export const ONE_HOUR = 60 * 60 * 1000

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
    let randomValue =
      typeof window !== "undefined" && window.crypto?.getRandomValues
        ? window.crypto.getRandomValues(new Uint8Array(1))[0]
        : typeof crypto !== "undefined" && crypto.getRandomValues
          ? crypto.getRandomValues(new Uint8Array(1))[0]
          : undefined
    if (!randomValue) randomValue = Math.floor(Math.random() * 256)
    return (num ^ (randomValue & (15 >> (num / 4)))).toString(16)
  })
}

export function ensureDirectory(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}
