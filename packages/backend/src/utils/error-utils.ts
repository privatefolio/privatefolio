import { logger as defaultLogger } from "src/logger"
import { serverId, telemetry } from "src/telemetry"
import { environment, runtime } from "src/utils/utils"

export function logAndReportError(
  error: Error,
  extraMessage?: string,
  extraProperties = {},
  logger = defaultLogger
): void {
  logger.error(extraMessage, {
    errorMessage: String(error),
    stackTrace: error.stack,
    ...extraProperties,
  })
  try {
    telemetry.captureException(error, serverId, {
      environment,
      extraMessage,
      runtime,
      ...extraProperties,
    })
  } catch {}
}
