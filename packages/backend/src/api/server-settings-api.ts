import { SubscriptionChannel } from "src/interfaces"
import { ONE_DAY_MIN } from "src/utils/formatting-utils"

import { appEventEmitter } from "./internal"
import { getServerValue, setServerValue, subscribeToServerKV } from "./server-kv-api"

export interface ServerSettings {
  healthMetricsInterval: number // in minutes
  systemInfoInterval: number // in minutes
}

const DEFAULT_SERVER_SETTINGS: ServerSettings = {
  healthMetricsInterval: 5,
  systemInfoInterval: 7 * ONE_DAY_MIN,
}

const SERVER_SETTINGS_KEY = "settings"

export async function getServerSettings(): Promise<ServerSettings> {
  const settingsJson = await getServerValue<string>(SERVER_SETTINGS_KEY, null)
  if (!settingsJson) return DEFAULT_SERVER_SETTINGS

  try {
    const savedSettings = JSON.parse(settingsJson) as ServerSettings
    return Object.assign({}, DEFAULT_SERVER_SETTINGS, savedSettings)
  } catch (error) {
    console.error("Failed to parse server settings:", error)
    return DEFAULT_SERVER_SETTINGS
  }
}

export async function updateServerSettings(
  settings: Partial<ServerSettings>
): Promise<ServerSettings> {
  const currentSettings = await getServerSettings()

  const updatedSettings = {
    ...currentSettings,
    ...settings,
  }

  await setServerValue(SERVER_SETTINGS_KEY, JSON.stringify(updatedSettings))
  appEventEmitter.emit(SubscriptionChannel.ServerSettings, updatedSettings)
  return updatedSettings
}

export async function subscribeToServerSettings(callback: () => void) {
  return subscribeToServerKV(SERVER_SETTINGS_KEY, callback)
}
export async function subscribeToServerSettingsProperty(
  property: keyof ServerSettings,
  callback: () => void
) {
  let currentPropertyValue = (await getServerSettings())[property]

  return subscribeToServerKV<string>(SERVER_SETTINGS_KEY, (newValue) => {
    const newSettings = JSON.parse(newValue) as ServerSettings

    if (newSettings[property] !== currentPropertyValue) {
      currentPropertyValue = newSettings[property]
      callback()
    }
  })
}
