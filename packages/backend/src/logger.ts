import { getLogger } from "@logtape/logtape"
import { setupLogger } from "@privatefolio/node-common/src/logger"
import { ensureDirectory } from "@privatefolio/node-common/src/utils"
import { join } from "path"

import { DATA_LOCATION, SERVER_LOGS_LOCATION } from "./settings/settings"
import {
  environment,
  isBunWorker,
  runtime,
  useBunSqlite,
  writesAllowed,
} from "./utils/environment-utils"

export { setupLogger }

ensureDirectory(SERVER_LOGS_LOCATION)

export const getLogFilePath = () => {
  const date = new Date().toISOString().slice(0, 10)
  return join(SERVER_LOGS_LOCATION, `${date}.log`)
}

await setupLogger(getLogFilePath())

export const logger = getLogger(isBunWorker ? ["worker"] : ["main"])

logger.info("Initialize backend", {
  dataLocation: DATA_LOCATION,
  environment,
  runtime,
  sqliteImpl: useBunSqlite ? "bun" : "sqlite3",
  sqliteWrites: writesAllowed ? "allowed" : "disallowed",
})
