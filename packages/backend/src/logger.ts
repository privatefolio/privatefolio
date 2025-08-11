import { getFileSink } from "@logtape/file"
import { configure, getConsoleSink, getJsonLinesFormatter, getLogger } from "@logtape/logtape"
import { getPrettyFormatter } from "@logtape/pretty"
import { existsSync, mkdirSync } from "fs"
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

if (!existsSync(SERVER_LOGS_LOCATION)) mkdirSync(SERVER_LOGS_LOCATION, { recursive: true })

export const getLogFilePath = () => {
  const date = new Date().toISOString().slice(0, 10)
  return join(SERVER_LOGS_LOCATION, `${date}.log`)
}

const sinks = isTestEnvironment ? [] : ["console", "file"]

export async function setupLogger(logFilePath: string) {
  await configure({
    loggers: [
      {
        category: [],
        lowestLevel: "debug",
        // lowestLevel: "trace",
        sinks,
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks,
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

if (!isTestEnvironment) {
  logger.info("Initialize backend", {
    dataLocation: DATA_LOCATION,
    environment,
    runtime,
    sqliteImpl: useBunSqlite ? "bun" : "sqlite3",
    sqliteWrites: writesAllowed ? "allowed" : "disallowed",
  })
}
