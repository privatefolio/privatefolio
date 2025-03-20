import { app } from "electron"
import fs from "fs/promises"
import os from "os"
import path from "path"

const LINUX_AUTOSTART_DIR = ".config/autostart"
const LINUX_DESKTOP = `
[Desktop Entry]
Type=Application
Version={{APP_VERSION}}
Name={{APP_NAME}}
Comment={{APP_NAME}} startup script
Exec={{APP_PATH}} {{ARGS}}
StartupNotify=false
Terminal=false
`

function getAutostartDirectory() {
  return path.join(os.homedir(), LINUX_AUTOSTART_DIR)
}

function getDesktopFilePath(appName: string) {
  return path.join(getAutostartDirectory(), `${appName}.desktop`)
}

function escapeFilePath(filePath: string): string {
  return filePath.replace(/ /g, "\\ ")
}

export async function enableAutoLaunchLinux(appName: string, appPath: string, args: string[] = []) {
  const fixedAppPath = escapeFilePath(appPath)
  const programArguments = args.join(" ")

  const desktop = LINUX_DESKTOP.trim()
    .replace(/{{APP_NAME}}/g, appName)
    .replace(/{{APP_PATH}}/g, fixedAppPath)
    .replace(/{{ARGS}}/g, programArguments)
    .replace(/{{APP_VERSION}}/g, app.getVersion())

  // Ensure autostart directory exists
  await fs.mkdir(getAutostartDirectory(), { recursive: true })

  // Create desktop file
  await fs.writeFile(getDesktopFilePath(appName), desktop)
}

export async function disableAutoLaunchLinux(appName: string) {
  try {
    await fs.unlink(getDesktopFilePath(appName))
  } catch (error) {
    // File doesn't exist, which is fine
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error
    }
  }
}

export async function isAutoLaunchEnabledLinux(appName: string): Promise<boolean> {
  try {
    await fs.access(getDesktopFilePath(appName))
    return true
  } catch {
    return false
  }
}
