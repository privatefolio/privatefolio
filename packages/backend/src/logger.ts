import { BunFile, FileSink } from "bun"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"

import { SERVER_LOGS_LOCATION } from "./settings/settings"

if (!existsSync(SERVER_LOGS_LOCATION)) mkdirSync(SERVER_LOGS_LOCATION, { recursive: true })

let fileSink: FileSink

// Rotate log file at midnight and every 24h thereafter
function openLogFile() {
  const date = new Date().toISOString().slice(0, 10)
  fileSink?.end()

  const bunFile: BunFile = Bun.file(join(SERVER_LOGS_LOCATION, `${date}.log`))
  fileSink = bunFile.writer()
}
openLogFile()

const msUntilMidnight = () => {
  const now = new Date()
  const next = new Date(now)
  next.setDate(now.getDate() + 1)
  next.setHours(0, 0, 0, 0)
  return next.getTime() - now.getTime()
}

setTimeout(() => {
  openLogFile()
  setInterval(openLogFile, 24 * 60 * 60 * 1000)
}, msUntilMidnight())

const originalConsole = <Record<string, (...args: unknown[]) => void>>{}
const levels = ["log", "info", "warn", "error", "debug"] as const
levels.forEach((level) => {
  if (typeof console[level] === "function") {
    originalConsole[level] = console[level].bind(console)
  }
})

function callOriginal(level: (typeof levels)[number], ...args: unknown[]) {
  const fn = originalConsole[level] || originalConsole.log
  fn(...args)
}

levels.forEach((level) => {
  if (!originalConsole[level]) return

  console[level] = (...args: unknown[]) => {
    const timestamp = new Date().toISOString()
    const msg = args
      .map((a) =>
        typeof a === "string"
          ? a
          : a instanceof Error
            ? a.stack || a.message
            : JSON.stringify(a, null, 2)
      )
      .join(" ")

    const entry = `${timestamp} [${level.toUpperCase()}] ${msg}\n`
    fileSink.write(entry)
    fileSink.flush()

    callOriginal(level, ...args)
  }
})

// Global error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", promise, "reason:", reason)
})

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err)
})

// Indicate readiness
console.log("Logger initialized.")
