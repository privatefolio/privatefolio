import { BrowserWindow, IpcMainEvent, Notification, shell } from "electron"

import { TITLE_BAR_OPTS } from "./api"
import * as backendManager from "./backend-manager"
import { logger } from "./logger"
import { PaletteMode } from "./preload"
import { SERVER_LOGS_LOCATION } from "./settings"
import { isMac, isProduction } from "./utils"

export function configureIpcMain(ipcMain: Electron.IpcMain, window: BrowserWindow) {
  ipcMain.on("notify", (_, message: string) => {
    new Notification({ body: message, title: "Notification" }).show()
  })
  ipcMain.on("set-mode", createSetModeHandler(window))
  ipcMain.on("open-logs-dir", handleOpenLogsDir)
  ipcMain.on("read-logs", handleReadLogs)
  ipcMain.on("open-dev-tools", (event) => {
    setTimeout(() => {
      window.webContents.openDevTools()
    }, 500)
    event.returnValue = true
  })
  ipcMain.on("get-backend-url", handleGetBackendUrl)
  ipcMain.on("is-backend-running", handleIsBackendRunning)
  ipcMain.handle("restart-backend", handleRestartBackend)
  ipcMain.on("open-external-link", handleOpenExternalLink)
}

function createSetModeHandler(window: BrowserWindow) {
  return function handleSetMode(event: IpcMainEvent, mode: PaletteMode) {
    logger.trace(`Setting theme mode ${mode}`)
    try {
      if (!isMac) window.setTitleBarOverlay(TITLE_BAR_OPTS[mode])
    } catch {}
    event.returnValue = true
  }
}

function handleOpenLogsDir(event: IpcMainEvent) {
  const dirPath = SERVER_LOGS_LOCATION
  shell.openPath(dirPath)
  event.returnValue = dirPath
}

function handleReadLogs(event: IpcMainEvent) {
  // const logsPath = getLogFilePath()
  // const logs = require("fs").readFileSync(logsPath).toString()
  event.returnValue = []
}

function handleGetBackendUrl(event: IpcMainEvent) {
  event.returnValue = `localhost:${backendManager.getPort()}`
}

function handleIsBackendRunning(event: IpcMainEvent) {
  event.returnValue = backendManager.isRunning()
}

async function handleRestartBackend() {
  logger.info("Restarting backend server...")

  // In development mode, we don't manage the backend process
  if (!isProduction) {
    logger.info("Cannot restart backend in development mode - managed by lerna")
    return false
  }

  await backendManager.stop()
  await backendManager.start()
  return backendManager.isRunning()
}

function handleOpenExternalLink(event: IpcMainEvent, url: string) {
  shell.openExternal(url)
  event.returnValue = true
}
