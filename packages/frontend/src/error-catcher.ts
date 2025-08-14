import { logAndReportError } from "./utils/error-utils"

window.addEventListener("unhandledrejection", ({ reason }) => {
  const error = reason instanceof Error ? reason : new Error(String(reason))
  logAndReportError(error, `Unhandled Rejection`)
})

window.addEventListener("error", ({ error }) => {
  logAndReportError(error, `Uncaught Exception`)
})
