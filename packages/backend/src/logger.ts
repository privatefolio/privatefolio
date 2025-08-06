import { getFileSink } from "@logtape/file"
import { configure, getConsoleSink, getJsonLinesFormatter, getLogger } from "@logtape/logtape"
import { getPrettyFormatter } from "@logtape/pretty"
import { existsSync, mkdirSync } from "fs"
import { readdir } from "fs/promises"
import { join } from "path"

import { DATA_LOCATION, SERVER_LOGS_LOCATION } from "./settings/settings"
import {
  environment,
  isBunWorker,
  isTestEnvironment,
  runtime,
  useBunSqlite,
  writesAllowed,
} from "./utils/environment-utils"
import { safeRemove } from "./utils/file-utils"
import { ONE_DAY } from "./utils/formatting-utils"

const msUntilMidnight = () => {
  const now = new Date()
  const next = new Date(now)
  next.setDate(now.getDate() + 1)
  next.setHours(0, 0, 0, 0)
  return next.getTime() - now.getTime()
}

if (!existsSync(SERVER_LOGS_LOCATION)) mkdirSync(SERVER_LOGS_LOCATION, { recursive: true })

const getLogFilePath = () => {
  const date = new Date().toISOString().slice(0, 10)
  return join(SERVER_LOGS_LOCATION, `${date}.log`)
}

async function setupLogger(logFilePath: string) {
  await configure({
    loggers: [
      {
        category: [],
        lowestLevel: "debug",
        // lowestLevel: "trace",
        sinks: ["console", "file"],
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console", "file"],
      },
    ],
    sinks: {
      console: getConsoleSink({
        formatter: getPrettyFormatter({
          categoryWidth: 14,
          properties: true,
        }),
      }),
      file: getFileSink(logFilePath, {
        flushInterval: 100,
        formatter: getJsonLinesFormatter(),
        nonBlocking: true,
      }),
    },
  })
}

await setupLogger(getLogFilePath())

export const logger = getLogger(isBunWorker ? ["worker"] : ["main"])

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", { promise, reason })
})

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", { error: err })
})

if (!isTestEnvironment) {
  logger.info("Initialize backend", {
    dataLocation: DATA_LOCATION,
    environment,
    runtime,
    sqliteImpl: useBunSqlite ? "bun" : "sqlite3",
    sqliteWrites: writesAllowed ? "allowed" : "disallowed",
  })
}

async function deleteOldLogFiles() {
  // delete log files older than 60 days
  const files = await readdir(SERVER_LOGS_LOCATION)
  const now = Date.now()
  // files are named like "2025-08-06.log"
  for (const file of files) {
    const date = file.split(".")[0]
    const fileDate = new Date(date).getTime()
    const daysDifference = (now - fileDate) / ONE_DAY
    if (daysDifference > 60) {
      const filePath = join(SERVER_LOGS_LOCATION, file)
      logger.info("Deleting old log file", { date, filePath })
      try {
        await safeRemove(filePath)
      } catch (error) {
        logger.error("Failed to delete old log file", { error, filePath })
      }
    }
  }
}

await deleteOldLogFiles()

// Set up log rotation at midnight and every 24h thereafter
async function rotateLogFile() {
  const newLogFilePath = getLogFilePath()
  await setupLogger(newLogFilePath)
  await deleteOldLogFiles()
}

setTimeout(() => {
  rotateLogFile()
  setInterval(rotateLogFile, ONE_DAY)
}, msUntilMidnight())
