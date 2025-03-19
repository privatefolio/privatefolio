import React, { PropsWithChildren, useEffect } from "react"

import { POSTHOG_KEY } from "./env"
import { $telemetry } from "./stores/app-store"
import { isProduction } from "./utils/utils"

export function AnalyticsProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    if (!isProduction) {
      console.log("Telemetry skipped")
      return
    }

    import("posthog-js")
      .then((x) => x.default)
      .then((posthog) => {
        if (!POSTHOG_KEY) {
          console.error(new Error("Posthog token missing"))
          return
        }

        const telemetry = $telemetry.get()

        if (!telemetry) {
          console.log("Telemetry disabled")
          return
        }

        if (window.location.toString().includes("localhost")) {
          posthog.debug()
        }

        posthog.init(POSTHOG_KEY, {
          api_host: "https://ph.protocol.fun",
          session_recording: {
            maskTextSelector: "*",
          },
          ui_host: "https://eu.posthog.com",
        })

        console.log("Telemetry enabled")

        // posthog.shutdown() FIXME TODO2: this doesn't work
      })
  }, [])

  return <>{children}</>
}
