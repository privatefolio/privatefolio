import { getLogger } from "@logtape/logtape"
import { configureLogger, getLatestLogFilename } from "@privatefolio/node-commons/src/logger"
import {
  configureMemoryLogger,
  getInMemoryRecords,
} from "@privatefolio/node-commons/src/logger-memory"

import { SERVER_LOGS_LOCATION } from "./settings"

configureMemoryLogger()

export const logger = getLogger(["electron"])

configureLogger(SERVER_LOGS_LOCATION, getLatestLogFilename()).then(() => {
  // flush memory logger to file
  for (const record of getInMemoryRecords()) {
    logger[record.level](record.message as TemplateStringsArray, record.properties)
  }
})
