import { app } from "electron"
import path from "path"

export const isProduction = app.isPackaged
export const hasDevFlag = process.argv.includes("--dev")
export const isDevelopment = !isProduction || hasDevFlag

export const isWindows = process.platform === "win32"
export const isLinux = process.platform === "linux"

export function getLatestLogFilepath() {
  const date = new Date().toISOString().split("T")[0]
  return path.join(app.getPath("userData"), `logs/debug-${date}.log`)
}

export function getLogsPath() {
  return path.join(app.getPath("userData"), "logs")
}
