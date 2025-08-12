import { FLUSH_INTERVAL } from "@privatefolio/node-common/src/logger"
import { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, shell, Tray } from "electron"
import Store from "electron-store"
import path from "path"

import { TITLE_BAR_OPTS } from "./api"
import { getAutoLaunchEnabled, toggleAutoLaunch } from "./auto-launch"
import { AutoUpdater } from "./auto-updater"
import * as backendManager from "./backend-manager"
import { configureIpcMain } from "./ipc-main"
import { getLogFilePath, logger } from "./logger"
import { DATA_LOCATION, SERVER_LOGS_LOCATION, SERVER_PORT } from "./settings"
import { environment, hasDevFlag, isMac, isProduction, isWindows } from "./utils"

interface WindowState {
  height: number
  isFullScreen: boolean
  isMaximized: boolean
  width: number
}

interface StoreType {
  autoUpdateEnabled: boolean
  windowState: WindowState
}

const store = new Store<StoreType>()

function getAutoUpdateEnabled(): boolean {
  return store.get("autoUpdateEnabled", true)
}

function toggleAutoUpdate(): boolean {
  const currentEnabled = getAutoUpdateEnabled()
  const newEnabled = !currentEnabled
  store.set("autoUpdateEnabled", newEnabled)

  if (newEnabled) {
    appUpdater.startPeriodicCheck()
  } else {
    appUpdater.stopPeriodicCheck()
  }

  return newEnabled
}

const startMinimized = process.argv.includes("--hidden")

logger.info("Initialize electron", {
  dataLocation: DATA_LOCATION,
  environment,
  hasDevFlag,
  os: process.platform,
  platform: "electron",
  serverPort: SERVER_PORT,
})

const appIconPath = isWindows
  ? path.join(__dirname, "images/icon.ico")
  : path.join(__dirname, "images/icon.png")

logger.trace(`App icon path ${appIconPath}`)

Menu.setApplicationMenu(
  !isMac
    ? null
    : Menu.buildFromTemplate([
        {
          label: app.getName(),
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
        {
          label: "Edit",
          submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            { role: "selectAll" },
          ],
        },
      ])
)

let isQuitting = false
let tray: Tray | null = null

const appUpdater = new AutoUpdater(logger)

function createWindow() {
  logger.trace("Creating main window")
  // Get saved window state
  const windowState = store.get("windowState", {
    height: 900,
    isFullScreen: false,
    isMaximized: false,
    width: 1600,
  })

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: windowState.height,
    icon: appIconPath,
    minHeight: 500,
    minWidth: 500,
    show: false,
    titleBarOverlay: TITLE_BAR_OPTS.light,
    titleBarStyle: "hidden",
    webPreferences: {
      additionalArguments: [`--${environment}`],
      preload: path.join(__dirname, "./preload.js"),
    },
    width: windowState.width,
  })

  // Restore maximized/fullscreen state
  if (windowState.isMaximized && !startMinimized) {
    mainWindow.maximize()
  }
  if (windowState.isFullScreen && !startMinimized) {
    mainWindow.setFullScreen(true)
  }

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
    setTimeout(() => {
      mainWindow.webContents.openDevTools()
    }, 500)
  }

  // Save window state on changes
  const saveWindowState = () => {
    if (!mainWindow.isMinimized()) {
      const bounds = mainWindow.getBounds()
      store.set("windowState", {
        ...bounds,
        isFullScreen: mainWindow.isFullScreen(),
        isMaximized: mainWindow.isMaximized(),
      })
    }
  }

  mainWindow.on("resize", saveWindowState)
  mainWindow.on("move", saveWindowState)
  mainWindow.on("maximize", saveWindowState)
  mainWindow.on("unmaximize", saveWindowState)
  mainWindow.on("enter-full-screen", saveWindowState)
  mainWindow.on("leave-full-screen", saveWindowState)

  mainWindow.on("close", async (event) => {
    if (!isQuitting) {
      logger.trace("Minimizing window to Tray")
      event.preventDefault()
      mainWindow.hide()
      updateTrayMenu(mainWindow)
      return false
    } else {
      logger.trace("Closing app...")
      await new Promise((resolve) => setTimeout(resolve, FLUSH_INTERVAL + 100))
    }
  })
  return mainWindow
}

async function updateTrayMenu(mainWindow: BrowserWindow | null) {
  if (!mainWindow) return

  const isVisible = mainWindow.isVisible()
  const isAutoLaunchEnabled = await getAutoLaunchEnabled()
  const isAutoUpdateEnabled = getAutoUpdateEnabled()
  const isDevToolsOpened = mainWindow.webContents.isDevToolsOpened()

  logger.trace(`Updating tray menu`, { isDevToolsOpened, isWindowVisible: isVisible })

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
      checked: isAutoLaunchEnabled,
      click: async function () {
        const newEnabled = await toggleAutoLaunch()
        logger.trace(newEnabled ? "App added to startup" : "App removed from startup", {
          exe: app.getPath("exe"),
        })
        updateTrayMenu(mainWindow)
      },
      label: "Auto-start on login",
      type: "checkbox",
    },
    {
      checked: isAutoUpdateEnabled,
      click: async function () {
        const newEnabled = toggleAutoUpdate()
        logger.trace(`Auto-update ${newEnabled ? "enabled" : "disabled"}`)
        updateTrayMenu(mainWindow)
      },
      label: "Auto-update",
      type: "checkbox",
    },
    {
      click: function () {
        appUpdater.checkForUpdates(true)
      },
      label: "Check for Updates",
    },
    {
      label: "Debug",
      submenu: [
        {
          enabled: false,
          label: `Version: v${app.getVersion()}`,
        },
        {
          checked: isDevToolsOpened,
          click: function () {
            // logger.trace(`Dev tools ${isDevToolsOpened ? "closing" : "opening"}`)
            if (isDevToolsOpened) {
              mainWindow.webContents.closeDevTools()
            } else {
              mainWindow.webContents.openDevTools()
            }
            setTimeout(() => {
              updateTrayMenu(mainWindow)
            }, 500)
          },
          label: "Open dev tools",
          type: "checkbox",
        },
        {
          checked: hasDevFlag,
          click: async function () {
            if (backendManager.isRunning()) {
              await backendManager.stop()
            }
            app.relaunch({ args: hasDevFlag ? [] : ["--dev"] })
            app.exit(0)
          },
          label: "Extra logging",
          type: "checkbox",
        },
        {
          click: function () {
            shell.openPath(getLogFilePath())
          },
          label: "Open latest log file",
        },
        {
          click: function () {
            shell.openPath(SERVER_LOGS_LOCATION)
          },
          label: "Open logs directory",
        },
        {
          click: function () {
            shell.openPath(path.join(app.getPath("userData"), "data"))
          },
          label: "Open user data directory",
        },
        {
          click: function () {
            shell.openPath(path.join(app.getPath("userData"), "config.json"))
          },
          label: "Open config file",
        },
        {
          click: async function () {
            const { response } = await dialog.showMessageBox(mainWindow, {
              buttons: ["Cancel", "Remove all data"],
              cancelId: 0,
              defaultId: 0,
              detail: "This will delete all your data and settings. This action cannot be undone.",
              message: "Are you sure you want to remove all data?",
              title: "Remove all data",
              type: "warning",
            })

            if (response === 1) {
              try {
                if (backendManager.isRunning()) {
                  await backendManager.stop()
                }
                store.clear()
                const dataLocation = path.join(app.getPath("userData"), "data")
                require("fs").rmSync(dataLocation, { force: true, recursive: true })
                app.relaunch()
                app.exit(0)
              } catch (error) {
                logger.error("Failed to remove data", { error })
                dialog.showErrorBox(
                  "Error",
                  "Failed to remove data. Please try to manually delete the data located at:\n" +
                    path.join(app.getPath("userData"), "data")
                )
              }
            }
          },
          label: "Remove all data",
        },
      ],
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

logger.trace("Getting single instance lock")
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  logger.trace("Couldn't get lock, quitting")
  app.quit()
} else {
  let mainWindow: BrowserWindow | null = null
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    logger.trace("App is ready!")

    // Start the backend server
    if (isProduction) {
      try {
        await backendManager.start()
        logger.trace("Backend started successfully")
      } catch (error) {
        logger.error("Failed to start backend", { error })
      }
    }

    mainWindow = createWindow()
    logger.trace("Configuring IPC")
    configureIpcMain(ipcMain, mainWindow)

    logger.trace("Initializing auto-updater")
    appUpdater.setMainWindow(mainWindow)
    if (getAutoUpdateEnabled()) appUpdater.startPeriodicCheck()

    logger.trace("Creating tray")
    const trayIcon = nativeImage.createFromPath(appIconPath)
    if (trayIcon.isEmpty()) {
      logger.error("Failed to load tray icon from path", { appIconPath })
    }
    tray = new Tray(trayIcon)
    tray.setToolTip("Privatefolio")
    function handleClick() {
      if (!mainWindow) return

      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      } else if (!mainWindow.isVisible()) {
        mainWindow.show()
      }

      setTimeout(() => mainWindow.focus(), 100)
      updateTrayMenu(mainWindow)
    }
    tray.on("click", handleClick)
    tray.on("double-click", handleClick)
    if (mainWindow) {
      updateTrayMenu(mainWindow)
    }
    if (!startMinimized) {
      logger.trace("Showing main window")
      mainWindow.show()
      // force focus
      setTimeout(() => mainWindow.focus(), 100)
    } else {
      logger.trace("Starting minimized")
    }
  })

  app.on("second-instance", () => {
    logger.trace("Second instance opened", { mainWindow: !!mainWindow })
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
    logger.trace("Before quit event")
    isQuitting = true
    appUpdater.stopPeriodicCheck()

    // If the backend is running, stop it gracefully
    if (backendManager.isRunning()) {
      event.preventDefault()
      try {
        await backendManager.stop()
        // Give a small delay to ensure logs are written
        await new Promise((resolve) => setTimeout(resolve, FLUSH_INTERVAL + 100))
      } catch (error) {
        logger.error("Error during shutdown", { error })
      }
      app.quit()
    }
  })

  // Handle window-all-closed event
  app.on("window-all-closed", () => {
    logger.trace("All windows closed")
    if (process.platform !== "darwin" && isQuitting) {
      app.quit()
    }
  })
}
