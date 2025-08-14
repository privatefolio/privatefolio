import { PaletteMode } from "@mui/material"

declare global {
  interface Window {
    electron?: ElectronAPI
  }
}

interface ElectronAPI {
  backend: {
    getUrl: () => string
    isRunning: () => boolean
    restart: () => void
  }
  isProduction: boolean
  notifications: {
    send: (message: string) => void
  }
  openDevTools: () => void
  openExternalLink: (url: string) => void
  openLogsDir: () => string
  platform: NodeJS.Platform
  setMode: (mode: PaletteMode) => boolean
}

export const setElectronMode = window.electron?.setMode
export const openExternalLink = window.electron?.openExternalLink
export const restartBackend = window.electron?.backend.restart
export const isElectron = Boolean(window.electron)
export const isWindows = window.electron && window.electron.platform === "win32"
export const isLinux = window.electron && window.electron.platform === "linux"
export const isMac = window.electron && window.electron.platform === "darwin"

export const isProductionElectron = !!window.electron?.isProduction
export const backendUrl = window.electron?.backend.getUrl()

console.log(`Electron API ${isElectron ? "available" : "not available"}`)

export const { openLogsDir, openDevTools } = window.electron || {}
