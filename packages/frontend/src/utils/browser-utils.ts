import { logger } from "@nanostores/logger"
import { AnyStore } from "nanostores"

import { isProduction } from "./utils"

export function logAtoms(atoms: { [key: string]: AnyStore }) {
  if (!isProduction) {
    logger(atoms, {
      messages: {
        mount: false,
        unmount: false,
      },
    })
  }
}

export function closeSubscription(subscription: Promise<() => void>) {
  function closeSub() {
    subscription
      .then((unsubscribe) => {
        try {
          unsubscribe()
        } catch {}
      })
      .catch()
  }

  window.addEventListener("beforeunload", closeSub)

  return () => {
    closeSub()
    window.removeEventListener("beforeunload", closeSub)
  }
}
