import { app, BrowserWindow, ipcMain, Menu, Tray } from "electron"
import Logger from "electron-log/main"
import path from "path"

import { TITLE_BAR_OPTS } from "./api"
import * as backendManager from "./backend-manager"
import { configureIpcMain } from "./ipc-main"
import { getLogsPath, hasDevFlag, isProduction, isWindows } from "./utils"

Logger.transports.file.resolvePathFn = getLogsPath
Logger.initialize({ spyRendererConsole: false })
Logger.errorHandler.startCatching()
Logger.eventLogger.startLogging()
Object.assign(console, Logger.scope("Main"))

console.log("Starting app...")
console.log("Logging to", getLogsPath())
console.log("Dev flag", hasDevFlag)

// Logs: C:\Users\daniel\AppData\Local\SquirrelTemp
const squirrel = require("electron-squirrel-startup")

console.log("Squirrel startup", squirrel)
if (squirrel) app.quit()

console.log("Production", isProduction)

if (!isProduction) {
  const executable = isWindows ? "electron.cmd" : "electron"
  require("electron-reload")(__dirname, {
    electron: path.resolve(__dirname, "../node_modules/.bin", executable),
    forceHardReset: true,
    hardResetMethod: "exit",
  })
}

const appIconPath = isWindows
  ? path.join(__dirname, "images/icon.ico")
  : path.join(__dirname, "images/icon.png")

console.log("App icon path", appIconPath)

// Hide the "File Edit View Window Help" submenu
Menu.setApplicationMenu(null)

let isQuitting = false
let tray: Tray | null = null

function createWindow() {
  console.log("Creating main window")
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 900,
    icon: appIconPath,
    minHeight: 480,
    minWidth: 480,
    show: false,
    titleBarOverlay: TITLE_BAR_OPTS.light,
    titleBarStyle: "default",
    webPreferences: {
      additionalArguments: isProduction ? ["--production"] : [],
      preload: path.join(__dirname, "./preload.js"),
    },
    width: 1600,
  })

  // Load the web app.
  if (isProduction) {
    const location = path.join(
      __dirname,
      "..",
      "node_modules",
      "privatefolio-frontend",
      "build",
      "index.html"
    )
    mainWindow.loadFile(location)
  } else {
    mainWindow.loadURL("http://localhost:4000")
  }

  // Open the DevTools.
  if (!isProduction || hasDevFlag) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      console.log("Minimizing window to Tray")
      event.preventDefault()
      mainWindow.hide()
      updateTrayMenu(mainWindow)
      return false
    } else {
      console.log("Closing app...")
      // disable logging to avoid errors
      Logger.errorHandler.stopCatching()
      Logger.eventLogger.stopLogging()
      Logger.transports.file.level = false
      Logger.transports.console.level = false
    }
  })
  return mainWindow
}

async function updateTrayMenu(mainWindow: BrowserWindow | null) {
  if (!mainWindow) return

  const loginItemSettings = app.getLoginItemSettings()

  const isVisible = mainWindow.isVisible()
  const isAutoLaunchEnabled = loginItemSettings.openAtLogin

  console.log("Updating tray menu for", isVisible ? "visible" : "hidden", "window")

  const contextMenu = Menu.buildFromTemplate([
    isVisible
      ? {
          click: function () {
            mainWindow.hide()
            updateTrayMenu(mainWindow)
          },
          label: "Minimize to Tray",
        }
      : {
          click: function () {
            mainWindow.show()
            // force focus
            setTimeout(() => mainWindow.focus(), 100)
            updateTrayMenu(mainWindow)
          },
          label: "Show Privatefolio",
        },
    {
      click: function () {
        app.setLoginItemSettings({
          args: ["--hidden"],
          enabled: !isAutoLaunchEnabled,
          openAtLogin: !isAutoLaunchEnabled,
          path: app.getPath("exe"),
        })
        console.log(
          isAutoLaunchEnabled ? "App removed from startup" : "App added to startup",
          app.getPath("exe")
        )
        updateTrayMenu(mainWindow)
      },
      label: isAutoLaunchEnabled ? "Remove app from startup" : "Add app to startup",
    },
    { type: "separator" },
    {
      click: function () {
        isQuitting = true
        app.quit()
      },
      label: "Exit",
    },
  ])

  if (tray) {
    tray.setContextMenu(contextMenu)
  }
}

console.log("Getting single instance lock")
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  console.log("Couldn't get lock, quitting")
  app.quit()
} else {
  let mainWindow: BrowserWindow | null = null
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    console.log("App is ready!")

    // Start the backend server
    console.log("Backend server should start:", isProduction)
    if (isProduction) {
      try {
        await backendManager.start()
        console.log("Backend started successfully")
      } catch (error) {
        console.error("Failed to start backend:", error)
      }
    }

    mainWindow = createWindow()
    console.log("Configuring IPC")
    configureIpcMain(ipcMain, mainWindow)
    console.log("Creating tray")
    tray = new Tray(appIconPath)
    tray.setToolTip("Privatefolio")
    tray.on("double-click", () => {
      if (mainWindow) {
        mainWindow.show()
        // force focus
        setTimeout(() => mainWindow.focus(), 100)
        updateTrayMenu(mainWindow)
      }
    })
    if (mainWindow) {
      updateTrayMenu(mainWindow)
    }
    if (!process.argv.includes("--hidden")) {
      console.log("Showing main window")
      mainWindow.show()
      // force focus
      setTimeout(() => mainWindow.focus(), 100)
    } else {
      console.log("Starting minimized")
    }
  })

  app.on("second-instance", () => {
    console.log("Second instance opened", !!mainWindow)
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) {
        mainWindow.show()
        // force focus
        setTimeout(() => mainWindow.focus(), 100)
      }
      // force focus
      setTimeout(() => mainWindow.focus(), 100)
    }
  })

  // Handle app quit
  app.on("before-quit", async (event) => {
    console.log("Before quit event")
    isQuitting = true

    // If the backend is running, stop it gracefully
    if (backendManager.isRunning()) {
      event.preventDefault()
      await backendManager.stop()
      app.quit()
    }
  })

  // Handle window-all-closed event
  app.on("window-all-closed", () => {
    console.log("All windows closed")
    if (process.platform !== "darwin" && isQuitting) {
      app.quit()
    }
  })
}
