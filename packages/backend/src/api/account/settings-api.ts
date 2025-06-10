import { DEFAULT_SETTINGS, Settings } from "../../settings/settings"
import { getValue, setValue, subscribeToKV } from "./kv-api"

const SETTINGS_KEY = "settings"

export async function getSettings(accountName: string): Promise<Settings> {
  const settingsJson = await getValue<string>(accountName, SETTINGS_KEY, null)
  if (!settingsJson) {
    // Initialize with default settings
    await setValue(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS), accountName)
    return DEFAULT_SETTINGS
  }

  try {
    const savedSettings = JSON.parse(settingsJson) as Settings
    return Object.assign({}, DEFAULT_SETTINGS, savedSettings)
  } catch (error) {
    console.error("Failed to parse settings:", error)
    return DEFAULT_SETTINGS
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

export async function subscribeToSettings(
  accountName: string,
  callback: (settings: Settings) => void
) {
  return subscribeToKV(accountName, SETTINGS_KEY, callback)
}
