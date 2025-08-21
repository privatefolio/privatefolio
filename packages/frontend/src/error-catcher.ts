import { enqueueSnackbar } from "notistack"

import { logAndReportError } from "./utils/error-utils"

window.addEventListener("unhandledrejection", (event) => {
  const { reason } = event
  try {
    event.preventDefault()
    event.stopPropagation()
  } catch {}
  const error = reason instanceof Error ? reason : new Error(String(reason))
  if (String(error).includes("Incorrect password.")) {
    return
  }
  if (String(error).includes("Login or sign up to continue.")) {
    enqueueSnackbar("Login or sign up to continue", {
      preventDuplicate: true,
      variant: "error",
    })
    return
  }
  logAndReportError(error, `Unhandled Rejection`)
})

window.addEventListener("error", ({ error }) => {
  logAndReportError(error, `Uncaught Exception`)
})
