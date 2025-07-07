import { PaletteMode } from "@mui/material"
import Logger from "electron-log/renderer"

declare global {
  interface Window {
    electron?: ElectronAPI
  }
}

interface ElectronAPI {
  isProduction: boolean
  notifications: {
    send: (message: string) => void
  }
  openDevTools: () => void
  openExternalLink: (url: string) => void
  openLogsDir: () => string
  platform: NodeJS.Platform
  readLogs: () => string
  setMode: (mode: PaletteMode) => boolean
}

export const setElectronMode = window.electron?.setMode
export const openExternalLink = window.electron?.openExternalLink
export const isElectron = Boolean(window.electron)
export const isWindows = window.electron && window.electron.platform === "win32"
export const isProductionElectron = !!window.electron?.isProduction

console.log(`Electron API ${isElectron ? "available" : "not available"}`)

export const { openLogsDir, readLogs, openDevTools } = window.electron || {}

// Initialize logger
;(() => {
  if (isElectron && isProductionElectron) {
    const originalConsole = console
    Object.assign(console, Logger.scope("Renderer"))
    Logger.errorHandler.startCatching()
    // if the window is closing, stop catching
    window.addEventListener("beforeunload", () => {
      try {
        Logger.errorHandler.stopCatching()
        Object.assign(console, originalConsole)
      } catch {}
    })
  }
})()
