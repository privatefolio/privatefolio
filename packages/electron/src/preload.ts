const { ipcRenderer, contextBridge } = require("electron")
export type PaletteMode = "light" | "dark"

const isProduction = process.argv.includes("--production")

contextBridge.exposeInMainWorld("electron", {
  backend: {
    getUrl() {
      return ipcRenderer.sendSync("get-backend-url")
    },
    isRunning() {
      return ipcRenderer.sendSync("is-backend-running")
    },
    restart() {
      return ipcRenderer.invoke("restart-backend")
    },
  },
  isProduction,
  notifications: {
    send(message: string) {
      ipcRenderer.send("notify", message)
    },
  },
  openDevTools() {
    return ipcRenderer.sendSync("open-dev-tools")
  },
  openExternalLink(url: string) {
    return ipcRenderer.sendSync("open-external-link", url)
  },
  openLogsDir() {
    return ipcRenderer.sendSync("open-logs-dir")
  },
  platform: process.platform,
  readLogs() {
    // TODO9
    return ipcRenderer.sendSync("read-logs")
  },
  setMode(mode: PaletteMode) {
    return ipcRenderer.sendSync("set-mode", mode)
  },
})

window.addEventListener("DOMContentLoaded", () => {
  const deps: string[] = []
  for (const dependency of ["chrome", "node", "electron"]) {
    deps.push(`${dependency} ${process.versions[dependency]}`)
  }
  console.log("Platform versions", deps.join(", "))
  console.log("Shell environment is", isProduction ? "production" : "development")
})
