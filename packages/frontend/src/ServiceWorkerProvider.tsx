import { PropsWithChildren, useEffect } from "react"

import { $serviceWorker } from "./stores/notifications-store"
import { isElectron } from "./utils/electron-utils"
import { logAndReportError } from "./utils/error-utils"

export function ServiceWorkerProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    if ("serviceWorker" in navigator && !isElectron) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("ServiceWorker registered.")
          $serviceWorker.set(registration)
        })
        .catch((registrationError) => {
          logAndReportError(registrationError, "ServiceWorker registration failed")
        })
    } else {
      logAndReportError(
        new Error("serverWorker not supported"),
        "ServiceWorker registration failed"
      )
    }
  }, [])

  return children
}
