const { ipcRenderer, contextBridge } = require("electron")
export type PaletteMode = "light" | "dark"

const isProduction = process.argv.includes("--production")

contextBridge.exposeInMainWorld("electron", {
  backend: {
    // Returns the URL of the backend
    getUrl() {
      return ipcRenderer.sendSync("get-backend-url")
    },
    // Check if the backend is running
    isRunning() {
      return ipcRenderer.sendSync("is-backend-running")
    },
    // Restart the backend server
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
  openLogsDir() {
    return ipcRenderer.sendSync("open-logs-dir")
  },
  platform: process.platform,
  readLogs() {
    return ipcRenderer.sendSync("read-logs")
  },
  // async sendImage(base64Image: string) {
  //   return ipcRenderer.invoke("set-image", base64Image)
  // },
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
