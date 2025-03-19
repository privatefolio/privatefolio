import { app, BrowserWindow, IpcMainEvent, Notification, shell } from "electron"
import path from "path"

import { TITLE_BAR_OPTS } from "./api"
import * as backendManager from "./backend-manager"
import { PaletteMode } from "./preload"
import { getLogsPath, isProduction, isWindows } from "./utils"

export function configureIpcMain(ipcMain: Electron.IpcMain, window: BrowserWindow) {
  ipcMain.on("notify", (_, message: string) => {
    // console.log("📜 LOG > ipcMain.on notify > message")
    new Notification({ body: message, title: "Notification" }).show()
  })
  ipcMain.on("set-mode", createSetModeHandler(window))
  ipcMain.on("open-logs-dir", handleOpenLogsDir)
  ipcMain.on("read-logs", handleReadLogs)
  ipcMain.on("open-dev-tools", (event) => {
    window.webContents.openDevTools()
    event.returnValue = true
  })

  // Backend-related handlers
  ipcMain.on("get-backend-url", handleGetBackendUrl)
  ipcMain.on("is-backend-running", handleIsBackendRunning)
  ipcMain.handle("restart-backend", handleRestartBackend)
}

function createSetModeHandler(window: BrowserWindow) {
  return function handleSetMode(event: IpcMainEvent, mode: PaletteMode) {
    console.log("Setting theme mode", mode)
    if (isWindows) {
      window.setTitleBarOverlay(TITLE_BAR_OPTS[mode])
    }
    event.returnValue = true
  }
}

function handleOpenLogsDir(event: IpcMainEvent) {
  const dirPath = path.join(app.getPath("userData"), "logs")
  shell.openPath(dirPath)
  event.returnValue = dirPath
}

function handleReadLogs(event: IpcMainEvent) {
  const logsPath = getLogsPath()
  const logs = require("fs").readFileSync(logsPath).toString()
  event.returnValue = logs
}

/**
 * Handles the get-backend-url event
 */
function handleGetBackendUrl(event: IpcMainEvent) {
  event.returnValue = `http://localhost:${backendManager.getPort()}`
}

/**
 * Handles the is-backend-running event
 */
function handleIsBackendRunning(event: IpcMainEvent) {
  event.returnValue = backendManager.isRunning()
}

/**
 * Handles the restart-backend event
 */
async function handleRestartBackend() {
  console.log("Restarting backend server...")

  // In development mode, we don't manage the backend process
  if (!isProduction) {
    console.log("Cannot restart backend in development mode - managed by lerna")
    return false
  }

  await backendManager.stop()
  await backendManager.start()
  return backendManager.isRunning()
}
