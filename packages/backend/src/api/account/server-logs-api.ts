import { access, readFile } from "fs/promises"
import path from "path"
import { ServerLog, SubscriptionChannel } from "src/interfaces"
import { logger } from "src/logger"
import { SERVER_LOGS_LOCATION } from "src/settings/settings"
import { stripAnsi } from "src/utils/ansi-utils"
import { isBunWorker } from "src/utils/environment-utils"
import { logAndReportError } from "src/utils/error-utils"
import { createSubscription } from "src/utils/sub-utils"

import { appEventEmitter } from "../internal"

const LEVEL_SEVERITY = {
  debug: 1,
  error: 4,
  fatal: 5,
  info: 2,
  trace: 0,
  warn: 3,
}

export async function queryServerLogs(
  filters: Record<string, string | number> = {},
  rowsPerPage = 25,
  page = 0,
  order: "asc" | "desc" = "desc",
  orderBy: keyof ServerLog = "timestamp",
  date = new Date().toISOString().slice(0, 10)
): Promise<[ServerLog[], number]> {
  const logFilePath = path.join(SERVER_LOGS_LOCATION, `${date}.log`)

  try {
    await access(logFilePath)
    const content = await readFile(logFilePath, "utf-8")
    const lines = content.split("\n")

    // If the last line is empty (often due to a trailing newline), remove it before slicing
    if (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop()

    // Parse all logs
    let allLogs = lines
      .map(stripAnsi)
      .map((logLine, index) => {
        try {
          const logData = JSON.parse(logLine)

          return {
            categories: logData.logger.split("."),
            id: `${date}_row${index}`,
            level: logData.level.toLowerCase(),
            message: logData.message.trim(),
            properties: logData.properties,
            timestamp: new Date(logData["@timestamp"]).getTime(),
          }
        } catch (error) {
          return null
        }
      })
      .filter((entry): entry is ServerLog => entry !== null)

    // Apply filters
    if (filters.level) {
      allLogs = allLogs.filter((log) =>
        log.level.toLowerCase().includes(String(filters.level).toLowerCase())
      )
    }
    if (filters.search) {
      allLogs = allLogs.filter(
        (log) =>
          log.message.toLowerCase().includes(String(filters.search).toLowerCase()) ||
          log.categories.some((category) =>
            category.toLowerCase().includes(String(filters.search).toLowerCase())
          )
      )
    }

    // Sort by timestamp
    allLogs.sort((a, b) => {
      if (order === "desc") {
        return b.timestamp - a.timestamp
      } else {
        return a.timestamp - b.timestamp
      }
    })
    // Sort by level severity if specified
    if (orderBy === "level") {
      allLogs.sort((a, b) => {
        const aSeverity = LEVEL_SEVERITY[a.level as keyof typeof LEVEL_SEVERITY]
        const bSeverity = LEVEL_SEVERITY[b.level as keyof typeof LEVEL_SEVERITY]

        if (order === "desc") {
          return bSeverity - aSeverity
        } else {
          return aSeverity - bSeverity
        }
      })
    }

    const totalCount = allLogs.length

    // Apply pagination
    const startIndex = page * rowsPerPage
    const paginatedLogs = allLogs.slice(startIndex, startIndex + rowsPerPage)

    return [paginatedLogs, totalCount]
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      // If the specific day's log file doesn't exist, return empty results
      return [[], 0]
    }
    logAndReportError(error, `Failed to read server log`, { logFilePath })
    throw error
  }
}

let latestRowId = ""

// TODO7 should we unsub?
// Every second check the log file for changes and emit an event
if (isBunWorker) {
  const _interval = setInterval(async () => {
    const listeners = appEventEmitter.listenerCount(SubscriptionChannel.ServerLogs)
    if (listeners === 0) return

    const [logs] = await queryServerLogs({}, 1, 1, "desc", "timestamp")
    const latestRow = logs[0]
    if (latestRow && latestRow.id !== latestRowId) {
      appEventEmitter.emit(SubscriptionChannel.ServerLogs)
      latestRowId = latestRow.id
    }
  }, 1_000)
}

export async function subscribeToServerLog(callback: () => void) {
  return createSubscription(undefined, SubscriptionChannel.ServerLogs, callback)
}

export async function throwTestError() {
  throw new Error("This is a test error")
}

export async function logUiError(message: string, properties: Record<string, unknown>) {
  logger.getChild("ui").error(message, properties)
}
