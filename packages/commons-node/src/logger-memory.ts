import { configureSync, LogLevel, LogRecord } from "@logtape/logtape"

const inMemoryRecords: LogRecord[] = []

export function configureMemoryLogger(lowestLevel: LogLevel = "debug") {
  configureSync({
    loggers: [
      {
        category: [],
        lowestLevel,
        sinks: ["inMemory"],
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["inMemory"],
      },
    ],
    reset: true,
    sinks: {
      inMemory: (record: LogRecord) => {
        inMemoryRecords.push(record)
      },
    },
  })
}

export function getInMemoryRecords() {
  return inMemoryRecords
}
