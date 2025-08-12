import { getLogger, Logger } from "@logtape/logtape"
import { setupLogger } from "@privatefolio/node-common/src/logger"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"

import { SERVER_LOGS_LOCATION } from "./settings"

if (!existsSync(SERVER_LOGS_LOCATION)) mkdirSync(SERVER_LOGS_LOCATION, { recursive: true })

export const getLogFilePath = () => {
  const date = new Date().toISOString().slice(0, 10)
  return join(SERVER_LOGS_LOCATION, `${date}.log`)
}

// --- Buffered logger to avoid losing logs before async setup completes ---
//  this is needed because we can't use top level await in main process
type LogLevel = "trace" | "debug" | "info" | "warn" | "error"

interface BufferedEntry {
  args: unknown[]
  level: LogLevel
}

const bufferedEntries: BufferedEntry[] = []
const MAX_BUFFERED_ENTRIES = 1000
let realLogger: Logger | null = null

function emit(level: LogLevel, ...args: unknown[]): void {
  if (realLogger) {
    // Logger is ready; forward immediately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-extra-semi
    ;(realLogger as any)[level](...args)
    return
  }
  // Buffer until setup completes
  if (bufferedEntries.length >= MAX_BUFFERED_ENTRIES) bufferedEntries.shift()
  bufferedEntries.push({ args, level })
}

export const logger = {
  debug: (...args: unknown[]) => emit("debug", ...args),
  error: (...args: unknown[]) => emit("error", ...args),
  info: (...args: unknown[]) => emit("info", ...args),
  trace: (...args: unknown[]) => emit("trace", ...args),
  warn: (...args: unknown[]) => emit("warn", ...args),
  // For libraries expecting a Logger, we cast at export site
} as unknown as Logger

// Kick off async setup and then swap to the real logger and flush the buffer
;(async () => {
  try {
    await setupLogger(getLogFilePath())
    realLogger = getLogger(["electron"]) as Logger
    if (bufferedEntries.length > 0) {
      for (const entry of bufferedEntries) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-extra-semi
        ;(realLogger as any)[entry.level](...entry.args)
      }
      bufferedEntries.length = 0
    }
  } catch (error) {
    console.error("Failed to setup logger", error)
  }
})()
