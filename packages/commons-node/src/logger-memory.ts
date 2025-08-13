import { configureSync, LogRecord } from "@logtape/logtape"

const inMemoryRecords: LogRecord[] = []

export function configureMemoryLogger() {
  configureSync({
    loggers: [
      {
        category: [],
        lowestLevel: "debug",
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
