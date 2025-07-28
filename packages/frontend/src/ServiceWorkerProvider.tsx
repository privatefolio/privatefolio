import { PropsWithChildren, useEffect } from "react"

import { $serviceWorker } from "./stores/notifications-store"

export function ServiceWorkerProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      console.log("ServiceWorker start")
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("ServiceWorker registered: ", !!registration)
          $serviceWorker.set(registration)
        })
        .catch((registrationError) => {
          console.log("ServiceWorker registration failed")
          console.error(registrationError)
        })
    } else {
      console.warn("ServiceWorker skipped")
    }
  }, [])

  return children
}
