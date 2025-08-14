import { $telemetry } from "src/stores/app-store"
import { $rpc } from "src/workers/remotes"

import { environment, mode } from "./environment-utils"

export function logAndReportError(
  error: unknown,
  extraMessage: string,
  extraProperties = {}
): void {
  console.error(extraMessage, error, extraProperties)
  $rpc.get().logUiError(extraMessage, {
    errorMessage: String(error),
    stackTrace: error instanceof Error ? error.stack : undefined,
    ...extraProperties,
  })
  try {
    $telemetry.get()?.captureException(error, {
      environment,
      extraMessage,
      mode,
      ...extraProperties,
    })
  } catch {}
}
