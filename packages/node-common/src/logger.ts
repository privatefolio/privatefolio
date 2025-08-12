import { getFileSink } from "@logtape/file"
import { configure, getConsoleSink, getJsonLinesFormatter } from "@logtape/logtape"
import { getPrettyFormatter } from "@logtape/pretty"

import { isTestEnvironment } from "./environment-utils"

const sinks = isTestEnvironment ? [] : ["console", "file"]

export const FLUSH_INTERVAL = 100

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
        flushInterval: FLUSH_INTERVAL,
        formatter: getJsonLinesFormatter(),
        nonBlocking: true,
      }),
    },
  })
}

// if (!existsSync(SERVER_LOGS_LOCATION)) mkdirSync(SERVER_LOGS_LOCATION, { recursive: true })

// export const getLogFilePath = () => {
//   const date = new Date().toISOString().slice(0, 10)
//   return join(SERVER_LOGS_LOCATION, `${date}.log`)
// }

// await setupLogger(getLogFilePath())

// export const logger = getLogger(isBunWorker ? ["worker"] : ["main"])

// logger.info("Initialize backend", {
//   dataLocation: DATA_LOCATION,
//   environment,
//   runtime,
//   sqliteImpl: useBunSqlite ? "bun" : "sqlite3",
//   sqliteWrites: writesAllowed ? "allowed" : "disallowed",
// })
