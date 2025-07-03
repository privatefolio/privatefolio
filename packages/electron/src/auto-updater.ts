/* eslint-disable @typescript-eslint/member-ordering */
import { app, BrowserWindow, dialog, shell } from "electron"
import type { Logger } from "electron-log"
import { autoUpdater, UpdateDownloadedEvent, UpdateInfo } from "electron-updater"

import { isProduction } from "./utils"

const CHECK_FOR_UPDATES_INTERVAL = 60 * 60 * 1000 // 1 hour
const CHECK_FOR_UPDATES_START_DELAY = 10 * 1000 // 10 seconds
const GITHUB_REPO_URL = "https://github.com/privatefolio/privatefolio"
const DOWNLOADS_URL = "https://privatefolio.xyz/downloads"

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

    const currentVersion = app.getVersion()
    const { response } = await dialog.showMessageBox(this.mainWindow, {
      buttons: ["Download update", "Read release notes", "Later"],
      cancelId: 2,
      defaultId: 0,
      detail: `You are currently running version ${currentVersion}. Would you like to download it now? The update will be downloaded in the background and applied when you restart the app.`,
      message: `A new version is available: ${info.version}`,
      title: "Update Available",
      type: "info",
    })

    if (response === 0) {
      autoUpdater.downloadUpdate()
    } else if (response === 1) {
      const releaseUrl = `${GITHUB_REPO_URL}/releases/tag/v${info.version}`
      shell.openExternal(releaseUrl)
    }
  }

  private async showRestartDialog(info: UpdateDownloadedEvent) {
    if (!this.mainWindow) return

    const { response } = await dialog.showMessageBox(this.mainWindow, {
      buttons: ["Restart now", "Later"],
      cancelId: 1,
      defaultId: 0,
      detail: "Restart the application to apply the update.",
      message: `Update downloaded: ${info.version}`,
      title: "Update ready",
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
    if (result?.isUpdateAvailable) {
      this.showUpdateDialog(result.updateInfo)
    } else {
      const { response } = await dialog.showMessageBox(this.mainWindow, {
        buttons: ["OK", "Show all releases"],
        cancelId: 0,
        defaultId: 0,
        message: "Privatefolio is up to date.",
        title: "Up to date",
        type: "info",
      })

      if (response === 1) {
        shell.openExternal(DOWNLOADS_URL)
      }
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
