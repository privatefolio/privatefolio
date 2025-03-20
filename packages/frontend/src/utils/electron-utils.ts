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
  openLogsDir: () => string
  platform: NodeJS.Platform
  readLogs: () => string
  // sendImage: (base64Image: string) => Promise<void>
  setMode: (mode: PaletteMode) => boolean
}

// export async function sendImageToElectron(fileName, base64: string) {
//   // remove "data:mime/type;base64," prefix from data url
//   const sanitized = base64.substring(base64.indexOf(",") + 1)
//   await window.electron?.sendImage(sanitized)
// }

export const setElectronMode = window.electron?.setMode
export const isElectron = Boolean(window.electron)
export const isWindows = window.electron && window.electron.platform === "win32"
export const isProductionElectron = window.electron?.isProduction

console.log("Electron env:", isElectron)

export const stickyHeader = false // isWindows

export const { openLogsDir, readLogs, openDevTools } = window.electron || {}

// Initialize logger
;(() => {
  if (isElectron) {
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
