import { getFileSink } from "@logtape/file"
import { configure, getConsoleSink, getJsonLinesFormatter, LogLevel } from "@logtape/logtape"
import { getPrettyFormatter } from "@logtape/pretty"
import { ONE_DAY } from "@privatefolio/commons/utils"
import { readdir } from "fs/promises"
import { join } from "path"

import { isTestEnvironment } from "./environment-utils"
import { ensureDirectory } from "./utils"

const sinks = isTestEnvironment ? [] : ["console", "file"]

export const FLUSH_INTERVAL = 100

export function getLatestLogFilename() {
  return `${new Date().toISOString().slice(0, 10)}.log`
}

export async function configureLogger(
  logsDirectory: string,
  logFileName: string,
  lowestLevel: LogLevel = "debug"
) {
  ensureDirectory(logsDirectory)
  const logFilePath = join(logsDirectory, logFileName)

  await configure({
    loggers: [
      {
        category: [],
        lowestLevel,
        sinks,
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks,
      },
    ],
    reset: true,
    sinks: {
      console: getConsoleSink({
        formatter: getPrettyFormatter({
          categoryWidth: 14,
          properties: true,
        }),
      }),
      file: getFileSink(logFilePath, {
        flushInterval: FLUSH_INTERVAL,
        formatter: getJsonLinesFormatter(),
        nonBlocking: true,
      }),
    },
  })
}

export { getLogger } from "@logtape/logtape"

export async function* getOldLogs(logsDirectory: string, cutoffDays = 60) {
  const files = await readdir(logsDirectory)
  const now = Date.now()

  for (const file of files) {
    // files are named like "2025-08-06.log"
    const date = file.split(".")[0]!
    const fileDate = new Date(date).getTime()
    const daysDifference = (now - fileDate) / ONE_DAY
    if (daysDifference > cutoffDays) {
      const filePath = join(logsDirectory, file)
      yield filePath
    }
  }
}

export function msUntilMidnight() {
  const now = new Date()
  const next = new Date(now)
  next.setDate(now.getDate() + 1)
  next.setHours(0, 0, 0, 0)
  return next.getTime() - now.getTime()
}
