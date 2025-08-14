import { configureLogger, getLatestLogFilename, getLogger } from "@privatefolio/commons-node/logger"

import { DATA_LOCATION, SERVER_LOGS_LOCATION } from "./settings/settings"
import {
  environment,
  isBunWorker,
  runtime,
  useBunSqlite,
  writesAllowed,
} from "./utils/environment-utils"

await configureLogger(SERVER_LOGS_LOCATION, getLatestLogFilename())

export const logger = getLogger(isBunWorker ? "worker" : "main")
export const uiLogger = getLogger("ui")

logger.info("Initialize backend", {
  dataLocation: DATA_LOCATION,
  environment,
  runtime,
  sqliteImpl: useBunSqlite ? "bun" : "sqlite3",
  sqliteWrites: writesAllowed ? "allowed" : "disallowed",
})
