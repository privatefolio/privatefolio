import { logAndReportError } from "./utils/error-utils"

window.addEventListener("unhandledrejection", ({ promise, reason }) => {
  const error = reason instanceof Error ? reason : new Error("Unhandled Rejection")
  logAndReportError(error, `Promise: ${promise}, Reason: ${reason}`)
})

window.addEventListener("error", ({ error }) => {
  logAndReportError(error, `Uncaught Exception`)
})
