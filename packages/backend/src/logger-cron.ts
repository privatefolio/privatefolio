import {
  configureLogger,
  getLatestLogFilename,
  getOldLogs,
  msUntilMidnight,
} from "@privatefolio/commons-node/src/logger"

import { logger } from "./logger"
import { SERVER_LOGS_LOCATION } from "./settings/settings"
import { logAndReportError } from "./utils/error-utils"
import { safeRemove } from "./utils/file-utils"
import { ONE_DAY, ONE_HOUR } from "./utils/formatting-utils"

async function deleteOldLogFiles() {
  for await (const filePath of getOldLogs(SERVER_LOGS_LOCATION)) {
    logger.info("Deleting old log file", { filePath })
    try {
      await safeRemove(filePath)
    } catch (error) {
      logAndReportError(error, "Failed to delete old log file", { filePath })
    }
  }
}

// Set up log rotation at midnight and every 24h thereafter
async function rotateLogFile() {
  logger.info("Cron: Rotating log file")
  await configureLogger(SERVER_LOGS_LOCATION, getLatestLogFilename())
  await deleteOldLogFiles()
}

setTimeout(async () => {
  await deleteOldLogFiles()
}, ONE_HOUR)

setTimeout(async () => {
  await rotateLogFile()
  setInterval(rotateLogFile, ONE_DAY)
}, msUntilMidnight())

logger.info("Cron: rotating log file scheduled", {
  nextRotation: new Date(Date.now() + msUntilMidnight()).toISOString(),
})
