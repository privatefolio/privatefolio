import { INPUT_DEBOUNCE_DURATION } from "src/settings"
import { $telemetry } from "src/stores/app-store"
import { $rpc } from "src/workers/remotes"

import { environment, mode } from "./environment-utils"

export function logAndReportError(error: unknown, extraMessage: string, extraProperties = {}) {
  console.error(extraMessage, error, extraProperties)

  setTimeout(
    () => {
      try {
        $rpc.get()?.logUiError(extraMessage, {
          errorMessage: String(error),
          stackTrace: error instanceof Error ? error.stack : undefined,
          ...extraProperties,
        })
        $telemetry.get()?.captureException(error, {
          environment,
          extraMessage,
          mode,
          ...extraProperties,
        })
      } catch {}
    },
    $rpc.get() ? 0 : INPUT_DEBOUNCE_DURATION
  )
}
