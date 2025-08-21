import { logAndReportError } from "./utils/error-utils"

process.on("unhandledRejection", (reason) => {
  const error = reason instanceof Error ? reason : new Error("Unhandled Rejection")
  logAndReportError(error, `Unhandled Rejection`)
})

process.on("uncaughtException", (error) => {
  logAndReportError(error, `Uncaught Exception`)
})
