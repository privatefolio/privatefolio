import { environment } from "./environment-utils"
import { logger as defaultLogger } from "./logger"
import { appId, telemetry } from "./telemetry"

export function logAndReportError(
  error: Error,
  extraMessage: string,
  extraProperties = {},
  logger = defaultLogger
) {
  try {
    logger.error(extraMessage, {
      errorMessage: String(error),
      stackTrace: error.stack,
      ...extraProperties,
    })
    telemetry.captureException(error, appId, {
      arch: process.arch,
      environment,
      extraMessage,
      os: process.platform,
      platform: "electron",
      ...extraProperties,
    })
  } catch {}
}
