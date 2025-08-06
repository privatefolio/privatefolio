import { logAndReportError } from "./utils/error-utils"

process.on("unhandledRejection", (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error("Unhandled Rejection")
  logAndReportError(error, `Promise: ${promise}, Reason: ${reason}`)
})

process.on("uncaughtException", (error) => {
  logAndReportError(error, `Uncaught Exception`)
})
