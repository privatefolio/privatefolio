/* eslint-disable @typescript-eslint/member-ordering */
import { BrowserWindow, dialog } from "electron"
import type { Logger } from "electron-log"
import { autoUpdater, UpdateDownloadedEvent, UpdateInfo } from "electron-updater"

import { isProduction } from "./utils"

const CHECK_FOR_UPDATES_INTERVAL = 60 * 60 * 1000 // 1 hour
const CHECK_FOR_UPDATES_START_DELAY = 10 * 1000 // 10 seconds

export class AutoUpdater {
  private mainWindow: BrowserWindow | null = null
  private updateCheckInterval: NodeJS.Timeout | null = null

  constructor(logger: Logger) {
    autoUpdater.logger = logger
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true
    this.setupEventHandlers()
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  private setupEventHandlers() {
    autoUpdater.on("checking-for-update", () => {
      console.log("Checking for update...")
    })

    autoUpdater.on("update-available", (info) => {
      console.log("Update available:", info.version)
      this.showUpdateDialog(info)
    })

    autoUpdater.on("update-not-available", (info) => {
      console.log("Update not available:", info.version)
    })

    autoUpdater.on("error", (err) => {
      console.error("Error in auto-updater:", err)
    })

    autoUpdater.on("download-progress", (progressObj) => {
      let logMessage = "Download speed: " + progressObj.bytesPerSecond
      logMessage = logMessage + " - Downloaded " + progressObj.percent + "%"
      logMessage = logMessage + " (" + progressObj.transferred + "/" + progressObj.total + ")"
      console.log(logMessage)
    })

    autoUpdater.on("update-downloaded", (info) => {
      console.log("Update downloaded:", info.version)
      this.showRestartDialog(info)
    })
  }

  private async showUpdateDialog(info: UpdateInfo) {
    if (!this.mainWindow) return

    const { response } = await dialog.showMessageBox(this.mainWindow, {
      buttons: ["Download Update", "Later"],
      cancelId: 1,
      defaultId: 0,
      detail:
        "Would you like to download it now? The update will be installed when you restart the app.",
      message: `A new version (${info.version}) is available.`,
      title: "Update Available",
      type: "info",
    })

    if (response === 0) {
      autoUpdater.downloadUpdate()
    }
  }

  private async showRestartDialog(info: UpdateDownloadedEvent) {
    if (!this.mainWindow) return

    const { response } = await dialog.showMessageBox(this.mainWindow, {
      buttons: ["Restart Now", "Later"],
      cancelId: 1,
      defaultId: 0,
      detail: "Restart the application to apply the update.",
      message: `Update (${info.version}) has been downloaded.`,
      title: "Update Ready",
      type: "info",
    })

    if (response === 0) {
      autoUpdater.quitAndInstall()
    }
  }

  async checkForUpdates(informUser = false) {
    if (!isProduction) {
      console.log("Skipping update check in development mode")
      return
    }

    console.log("Checking for updates...")
    const result = await autoUpdater.checkForUpdates()
    if (!informUser) return
    if (result?.updateInfo) {
      this.showUpdateDialog(result.updateInfo)
    } else {
      dialog.showMessageBox(this.mainWindow, {
        message: "Privatefolio is up to date.",
        title: "Up to date",
        type: "info",
      })
    }
  }

  startPeriodicCheck() {
    if (!isProduction) {
      console.log("Skipping periodic update checks in development mode")
      return
    }

    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates()
    }, CHECK_FOR_UPDATES_INTERVAL)

    setTimeout(() => {
      this.checkForUpdates()
    }, CHECK_FOR_UPDATES_START_DELAY)
  }

  stopPeriodicCheck() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval)
      this.updateCheckInterval = null
    }
  }
}
