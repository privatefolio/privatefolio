import { useStore } from "@nanostores/react"
import React, { PropsWithChildren, useEffect, useRef } from "react"

import { APP_VERSION, PLATFORM, POSTHOG_KEY } from "./env"
import { $telemetry, $telemetryEnabled } from "./stores/app-store"
import { $cloudUser } from "./stores/cloud-user-store"
import { logAndReportError } from "./utils/error-utils"
import { isProduction } from "./utils/utils"

export function TelemetryProvider({ children }: PropsWithChildren) {
  const telemetryEnabled = useStore($telemetryEnabled)
  const isInitialized = useRef(false)
  const cloudUser = useStore($cloudUser)

  useEffect(() => {
    if (!isProduction) {
      console.log("Telemetry skipped (non-production)")
      return
    }

    if (!POSTHOG_KEY) {
      logAndReportError(new Error("Posthog token missing"), "TelemetryProvider")
      return
    }

    // Initialize PostHog if telemetry is enabled and not already initialized
    if (telemetryEnabled && !isInitialized.current) {
      console.log("Telemetry initializing")
      import("posthog-js")
        .then((x) => x.default)
        .then((posthog) => {
          posthog.debug(false)
          // if (window.location.toString().includes("localhost")) posthog.debug()

          posthog.init(POSTHOG_KEY!, {
            api_host: "https://telemetry.privatefolio.app",
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

          $telemetry.set(posthog)
          isInitialized.current = true
          console.log("Telemetry enabled")
        })
        .catch((error) => {
          logAndReportError(error, "Failed to initialize telemetry")
        })
    }

    // Stop PostHog if telemetry is disabled and PostHog is initialized
    else if (!telemetryEnabled && isInitialized.current && $telemetry.get()) {
      console.log("Telemetry disabling")
      $telemetry.get()?.opt_out_capturing()
    }

    // Re-enable PostHog if telemetry is re-enabled
    else if (telemetryEnabled && isInitialized.current && $telemetry.get()) {
      console.log("Telemetry enabling")
      $telemetry.get()?.opt_in_capturing({
        captureEventName: "Telemetry re-enabled",
        captureProperties: {
          appVersion: APP_VERSION,
          platform: PLATFORM,
        },
      })
    }
  }, [telemetryEnabled])

  useEffect(() => {
    setTimeout(() => {
      if ($telemetry.get() && cloudUser) {
        console.log("Telemetry identify")
        const id = $telemetry.get()?.get_distinct_id()
        $telemetry.get()?.identify(id, {
          cloudId: cloudUser.id,
          email: cloudUser.email,
        })
      }
    }, 1_000)
  }, [cloudUser])

  return <>{children}</>
}
