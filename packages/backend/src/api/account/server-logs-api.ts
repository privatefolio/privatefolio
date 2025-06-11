import { access, readFile } from "fs/promises"
import path from "path"
import { SERVER_LOGS_LOCATION } from "src/settings/settings"
import { stripAnsi } from "src/utils/ansi-utils"

export async function getServerLogs(date = new Date().toISOString().slice(0, 10)): Promise<string> {
  const logFilePath = path.join(SERVER_LOGS_LOCATION, `${date}.log`)

  try {
    await access(logFilePath)
    const content = await readFile(logFilePath, "utf-8")
    const lines = content.split("\n")

    // If the last line is empty (often due to a trailing newline), remove it before slicing
    if (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop()

    const lastLines = lines.slice(-250)
    return lastLines.map(stripAnsi).join("\n")
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      // If the specific day's log file doesn't exist, return an empty string.
      return ""
    }
    console.error(`Failed to read server log from ${logFilePath}:`, error)
    throw error
  }
}

// export async function subscribeToServerLog(
//   callback: (logEntry: string) => void
// ): Promise<() => void> {
//   const listener = (logData: {
//     level: string
//     message: string // This is the pre-formatted message from logger.ts
//     originalArgs: any[]
//     timestamp: Date
//   }) => {
//     const { timestamp, level, message } = logData

//     // Format the log entry string for the callback
//     const formattedLogEntry = `${timestamp.toISOString()} [${level.toUpperCase()}] ${message}`
//     callback(formattedLogEntry)
//   }

//   generalLogEmitter.on(GENERAL_LOG_EVENT, listener)

//   // Return an unsubscribe function
//   return () => {
//     generalLogEmitter.off(GENERAL_LOG_EVENT, listener)
//   }
// }
