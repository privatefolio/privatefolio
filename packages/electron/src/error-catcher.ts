import { logAndReportError } from "./error-utils"

process.on("unhandledRejection", (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason))
  logAndReportError(error, `Unhandled Rejection`)
})

process.on("uncaughtException", (error) => {
  logAndReportError(error, `Uncaught Exception`)
})
