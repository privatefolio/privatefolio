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
        .unsubscribe(subscriptionId, false)
        .then(() => {
          // console.log("Subscription closed", subscriptionId)
        })
        .catch(() => {
          // console.warn("Error closing subscription", subscriptionId, error)
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

export function formatUserAgent(ua?: string): string {
  if (!ua) return "Unknown device"

  // 1. Browser detection
  const browserMatchers: [string, RegExp][] = [
    ["Edge", /Edg(e|A|IOS)?\/\d+/i],
    ["Opera", /OPR\/\d+/i],
    ["Chrome", /Chrome\/\d+/i],
    ["Safari", /Safari\/\d+/i],
    ["Firefox", /Firefox\/\d+/i],
    ["IE", /MSIE |Trident\//i],
  ]
  const rawBrowser = browserMatchers.find(([, re]) => re.test(ua))?.[0] || ua.split(" ")[0]

  // 2. OS extraction
  const osMatch = ua.match(/\(([^)]+)\)/)
  let rawOs = osMatch ? osMatch[1].split(";")[0].trim() : "Unknown OS"

  // 3. Simplify common OS strings
  if (/Windows NT/i.test(rawOs)) rawOs = "Windows"
  else if (/Mac OS X/i.test(rawOs)) rawOs = "macOS"
  else if (/Android/i.test(rawOs)) rawOs = "Android"
  else if (/iPhone|iPad|iPod/i.test(ua)) rawOs = "iOS"

  // 4. Capitalize first letter, lowercase the rest
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

  return `${capitalize(rawBrowser)} on ${capitalize(rawOs)}`
}
