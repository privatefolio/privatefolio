import { logAndReportError } from "src/utils/error-utils"

import { DEFAULT_SETTINGS, Settings } from "../../settings/settings"
import { getValue, setValue, subscribeToKV } from "./kv-api"

const SETTINGS_KEY = "settings"

export async function getSettings(accountName: string): Promise<Settings> {
  const settingsJson = await getValue<string>(accountName, SETTINGS_KEY, null)
  if (!settingsJson) {
    // Initialize with default settings
    await setValue(accountName, SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS))
    return DEFAULT_SETTINGS
  }

  try {
    const savedSettings = JSON.parse(settingsJson) as Settings
    return Object.assign({}, DEFAULT_SETTINGS, savedSettings)
  } catch (error) {
    logAndReportError(error, "Failed to read settings")
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

  await setValue(accountName, SETTINGS_KEY, JSON.stringify(updatedSettings))
  return updatedSettings
}

export async function subscribeToSettings(accountName: string, callback: () => void) {
  return subscribeToKV(accountName, SETTINGS_KEY, callback)
}

export async function subscribeToSettingsProperty(
  accountName: string,
  property: keyof Settings,
  callback: () => void
) {
  let currentPropertyValue = (await getSettings(accountName))[property]

  return subscribeToKV<string>(accountName, SETTINGS_KEY, (newValue) => {
    const newSettings = JSON.parse(newValue) as Settings

    if (newSettings[property] !== currentPropertyValue) {
      currentPropertyValue = newSettings[property]
      callback()
    }
  })
}
