import { PropsWithChildren, useEffect } from "react"

import { $pushSubscription, $serviceWorker } from "./stores/notifications-store"

export function ServiceWorkerProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      console.log("ServiceWorker start")
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("ServiceWorker registered: ", !!registration)
          $serviceWorker.set(registration)
          return registration.pushManager.getSubscription()
        })
        .then((subscription) => {
          console.log("ServiceWorker subscription: ", !!subscription)
          $pushSubscription.set(subscription)
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
