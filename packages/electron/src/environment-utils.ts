import { app } from "electron"

export const isProduction = app.isPackaged
export const hasDevFlag = process.argv.includes("--dev")
export const isDevelopment = !isProduction || hasDevFlag

export const environment = isProduction && !hasDevFlag ? "production" : "development"

export const isWindows = process.platform === "win32"
export const isLinux = process.platform === "linux"
export const isMac = process.platform === "darwin"
