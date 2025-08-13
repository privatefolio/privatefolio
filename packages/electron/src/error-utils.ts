import { logger as defaultLogger } from "./logger"
import { appId, telemetry } from "./telemetry"
import { environment } from "./environment-utils"

export function logAndReportError(
  error: Error,
  extraMessage: string,
  extraProperties = {},
  logger = defaultLogger
): void {
  logger.error(extraMessage, {
    errorMessage: String(error),
    stackTrace: error.stack,
    ...extraProperties,
  })
  try {
    telemetry.captureException(error, appId, {
      environment,
      extraMessage,
      os: process.platform,
      platform: "electron",
      ...extraProperties,
    })
  } catch {}
}
