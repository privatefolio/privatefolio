import { useStore } from "@nanostores/react"
import { PostHog } from "posthog-js"
import React, { PropsWithChildren, useEffect, useRef } from "react"

import { APP_VERSION, PLATFORM, POSTHOG_KEY } from "./env"
import { $telemetry } from "./stores/app-store"
import { $cloudUser } from "./stores/cloud-user-store"
import { isProduction } from "./utils/utils"

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const telemetry = useStore($telemetry)
  const posthogRef = useRef<PostHog | null>(null)
  const isInitialized = useRef(false)
  const cloudUser = useStore($cloudUser)

  useEffect(() => {
    if (!isProduction) {
      console.log("Telemetry skipped (non-production)")
      return
    }

    if (!POSTHOG_KEY) {
      console.error(new Error("Posthog token missing"))
      return
    }

    // Initialize PostHog if telemetry is enabled and not already initialized
    if (telemetry && !isInitialized.current) {
      console.log("Telemetry initializing")
      import("posthog-js")
        .then((x) => x.default)
        .then((posthog) => {
          if (window.location.toString().includes("localhost")) {
            posthog.debug()
          }

          posthog.init(POSTHOG_KEY!, {
            api_host: "https://ph.protocol.fun",
            person_profiles: "always",
            session_recording: {
              maskTextSelector: "*",
            },
            ui_host: "https://eu.posthog.com",
          })

          posthog.register({
            appVersion: APP_VERSION,
            platform: PLATFORM,
          })

          posthogRef.current = posthog
          isInitialized.current = true
          console.log("Telemetry enabled")
        })
        .catch((error) => {
          console.error("Failed to initialize telemetry:", error)
        })
    }

    // Stop PostHog if telemetry is disabled and PostHog is initialized
    else if (!telemetry && isInitialized.current && posthogRef.current) {
      console.log("Telemetry disabling")
      posthogRef.current.opt_out_capturing()
    }

    // Re-enable PostHog if telemetry is re-enabled
    else if (telemetry && isInitialized.current && posthogRef.current) {
      console.log("Telemetry enabling")
      posthogRef.current.opt_in_capturing({
        captureEventName: "Telemetry re-enabled",
        captureProperties: {
          appVersion: APP_VERSION,
          platform: PLATFORM,
        },
      })
    }
  }, [telemetry])

  useEffect(() => {
    if (posthogRef.current && cloudUser) {
      console.log("Telemetry identify")
      const id = posthogRef.current.get_distinct_id()
      posthogRef.current.identify(id, {
        cloudId: cloudUser.id,
        email: cloudUser.email,
      })
    }
  }, [cloudUser])

  return <>{children}</>
}
