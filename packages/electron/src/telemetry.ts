import { randomUUID } from "@privatefolio/commons/utils"
import { Telemetry } from "@privatefolio/commons-node/telemetry"
import { getOrInitializeSync } from "@privatefolio/commons-node/utils"

import { logger } from "./logger"
import { APP_ID_FILENAME, DATA_LOCATION } from "./settings"

function getAppId() {
  return getOrInitializeSync(DATA_LOCATION, APP_ID_FILENAME, () => `desktop.${randomUUID()}`)
}

export const appId = getAppId()
export const telemetry = new Telemetry()

logger.info("Telemetry enabled", { appId })
