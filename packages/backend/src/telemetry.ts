import { randomUUID } from "@privatefolio/commons/utils"
import { Telemetry } from "@privatefolio/commons-node/telemetry"
import { getOrInitialize } from "@privatefolio/commons-node/utils"

import { logger } from "./logger"
import { DATA_LOCATION, SERVER_ID_FILENAME } from "./settings/settings"

async function getServerId() {
  return getOrInitialize(DATA_LOCATION, SERVER_ID_FILENAME, () => `server.${randomUUID()}`)
}

export const serverId = await getServerId()
export const telemetry = new Telemetry()

logger.info("Telemetry enabled", { serverId })
