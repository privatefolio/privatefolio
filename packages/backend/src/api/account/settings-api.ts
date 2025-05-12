import { DEFAULT_CRON_REFRESH_INTERVAL } from "../../settings"
import { getValue, setValue, subscribeToKV } from "./kv-api"

export interface Settings {
  refreshInterval: number
}

const defaultSettings: Settings = {
  refreshInterval: DEFAULT_CRON_REFRESH_INTERVAL,
}

const SETTINGS_KEY = "settings"

export async function getSettings(accountName: string): Promise<Settings> {
  const settingsJson = await getValue<string>(accountName, SETTINGS_KEY, null)
  if (!settingsJson) {
    // Initialize with default settings
    await setValue(SETTINGS_KEY, JSON.stringify(defaultSettings), accountName)
    return defaultSettings
  }

  try {
    return JSON.parse(settingsJson) as Settings
  } catch (error) {
    console.error("Failed to parse settings:", error)
    return defaultSettings
  }
}

export async function updateSettings(
  accountName: string,
  settings: Partial<Settings>
): Promise<Settings> {
  const currentSettings = await getSettings(accountName)

  const updatedSettings = {
    ...currentSettings,
    ...settings,
  }

  await setValue(SETTINGS_KEY, JSON.stringify(updatedSettings), accountName)
  return updatedSettings
}

export async function subscribeToSettings(accountName: string, callback: () => void) {
  return subscribeToKV(accountName, SETTINGS_KEY, callback)
}
