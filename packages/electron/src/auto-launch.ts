import { app } from "electron"

import {
  disableAutoLaunchLinux,
  enableAutoLaunchLinux,
  isAutoLaunchEnabledLinux,
} from "./auto-launch-linux"
import { isLinux } from "./utils"

export function getAutoLaunchSettings() {
  return app.getLoginItemSettings()
}

export async function toggleAutoLaunch() {
  if (isLinux) {
    const appName = app.getName()
    const appPath = app.getPath("exe")
    const isEnabled = await isAutoLaunchEnabledLinux(appName)

    if (isEnabled) {
      await disableAutoLaunchLinux(appName)
      return false
    } else {
      await enableAutoLaunchLinux(appName, appPath, ["--hidden"])
      return true
    }
  }

  const currentSettings = getAutoLaunchSettings()
  const newEnabled = !currentSettings.openAtLogin

  app.setLoginItemSettings({
    args: ["--hidden"],
    enabled: newEnabled,
    openAtLogin: newEnabled,
    path: app.getPath("exe"),
  })

  return newEnabled
}

export async function getAutoLaunchEnabled(): Promise<boolean> {
  if (isLinux) {
    return isAutoLaunchEnabledLinux(app.getName())
  }
  return getAutoLaunchSettings().openAtLogin
}
