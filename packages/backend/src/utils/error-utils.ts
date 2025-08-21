import { logger as defaultLogger } from "src/logger"
import { serverId, telemetry } from "src/telemetry"
import { environment, isNode, isTestEnvironment, runtime } from "src/utils/utils"

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
    if (isTestEnvironment) return
    telemetry.captureException(error, serverId, {
      arch: isNode ? process.arch : undefined,
      environment,
      extraMessage,
      os: isNode ? process.platform : undefined,
      runtime,
      ...extraProperties,
    })
  } catch {}
}
