import { SystemInfo } from "src/interfaces"
import { logger } from "src/logger"
import { logAndReportError } from "src/utils/error-utils"
import { createSystemInfo } from "src/utils/server-utils"

import { getServerValue, setServerValue } from "./server-kv-api"

const SYSTEM_INFO_KEY = "system_info"

export async function getSystemInfo(): Promise<SystemInfo | null> {
  const systemInfoJson = await getServerValue<string>(SYSTEM_INFO_KEY, null)
  if (!systemInfoJson) return null

  try {
    return JSON.parse(systemInfoJson) as SystemInfo
  } catch (error) {
    logAndReportError(error, "Failed to parse system info")
    return null
  }
}

export async function setSystemInfo(systemInfo: SystemInfo): Promise<void> {
  await setServerValue(SYSTEM_INFO_KEY, JSON.stringify(systemInfo))
}

export async function ensureSystemInfo(): Promise<SystemInfo> {
  let systemInfo = await getSystemInfo()

  if (!systemInfo) {
    systemInfo = createSystemInfo()
    await setSystemInfo(systemInfo)
  }

  return systemInfo
}

export async function refreshSystemInfo(): Promise<SystemInfo> {
  const systemInfo = createSystemInfo()
  await setSystemInfo(systemInfo)
  logger.info("Refreshed system info")
  return systemInfo
}
