import { logger } from "@nanostores/logger"
import { AnyStore } from "nanostores"
import { SubscriptionId } from "src/interfaces"
import { RPC } from "src/workers/remotes"

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

export function closeSubscription(sub: Promise<SubscriptionId>, rpc: RPC) {
  function closeSub() {
    sub.then((subscriptionId) => {
      // console.log("Closing subscription", subscriptionId)
      rpc
        .unsubscribe(subscriptionId)
        .then(() => {
          // console.log("Subscription closed", subscriptionId)
        })
        .catch(() => {
          // console.error("Error closing subscription", subscriptionId, error)
        })
    })
  }

  window.addEventListener("beforeunload", closeSub)

  return () => {
    closeSub()
    window.removeEventListener("beforeunload", closeSub)
  }
}

export function isInputFocused() {
  const { activeElement } = document
  const inputFocused =
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    (activeElement instanceof HTMLElement && activeElement.isContentEditable)
  if (inputFocused) return true

  if (document.querySelector("div[role='dialog']")) return true
  if (document.querySelector("div[role='presentation']:not([aria-hidden='true'])")) return true

  return false
}
