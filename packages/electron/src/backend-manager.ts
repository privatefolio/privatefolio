import { ChildProcess, exec, spawn } from "child_process"
import { app } from "electron"
import path from "path"

import { appEnvironment, isProduction, isWindows } from "./utils"

let backendProcess: ChildProcess | null = null
let isStarted = false
const port = isProduction ? 5555 : 4001

console.log(`BackendManager: Using backend port: ${port} (${appEnvironment} environment)`)

/**
 * Starts the backend server
 */
export async function start(): Promise<void> {
  if (isStarted) {
    console.log("BackendManager: Backend is already running")
    return
  }

  console.log("BackendManager: Starting backend server...")

  try {
    // Kill any existing process on the port before starting
    await killProcessOnPort()

    const bunPath = path.join(
      __dirname,
      "..",
      // "..",
      // "app.asar.unpacked",
      "resources",
      "bun-sh",
      isWindows ? "privatefolio.exe" : "privatefolio"
    )
    console.log(`BackendManager: Using bun path: ${bunPath}`)

    const entrypoint = path.join(
      __dirname,
      "..",
      "node_modules",
      "privatefolio-backend",
      "build",
      "bundles",
      "bun.mjs"
    )

    console.log(`BackendManager: Starting with entrypoint: ${entrypoint}`)

    // Set environment variables
    const userDataPath = app.getPath("userData")
    const dataLocation = path.join(userDataPath, "data")

    console.log(`BackendManager: Using data location: ${dataLocation}`)

    const env = {
      ...process.env,
      // TODO2
      APP_VERSION: "0.2.0",
      DATA_LOCATION: dataLocation,
      GIT_DATE: new Date().toISOString(),
      GIT_HASH: "N/A",
      NODE_ENV: appEnvironment,
      PORT: port.toString(),
    }

    // Spawn the backend process
    backendProcess = spawn(bunPath, [entrypoint], {
      cwd: __dirname,
      env,
      stdio: "pipe", // Redirect stdout and stderr
    })

    backendProcess.stdout.on("data", (data) => {
      const str = data.toString()
      console.log(`BackendManager: stdout: ${str.endsWith("\n") ? str.slice(0, -1) : str}`)
    })

    backendProcess.stderr.on("data", (data) => {
      const str = data.toString()
      console.error(`BackendManager: stderr: ${str.endsWith("\n") ? str.slice(0, -1) : str}`)
    })

    backendProcess.on("error", (error) => {
      console.error(`BackendManager: Process error: ${error.message}`)
      isStarted = false
    })

    backendProcess.on("exit", (code) => {
      console.log(`BackendManager: Process exited with code ${code}`)
      isStarted = false
      backendProcess = null
    })

    // Set a flag to indicate the backend is running
    isStarted = true
    console.log(`BackendManager: Started on port ${port}`)
  } catch (error) {
    console.error(`BackendManager: Failed to start: ${error}`)
    throw error
  }
}

/**
 * Stops the backend server
 */
export async function stop(): Promise<void> {
  console.log("BackendManager: Stopping server...")

  if (!backendProcess) {
    console.log("BackendManager: No process to stop")
    return
  }

  // Try graceful shutdown first
  await killProcessOnPort()

  // Force kill if still running
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }

  isStarted = false
  console.log("BackendManager: Server stopped")
}

/**
 * Kill any process running on the backend port
 */
async function killProcessOnPort(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const command = isWindows
      ? `netstat -ano | findstr :${port} | findstr LISTENING`
      : `lsof -i :${port} -t`

    exec(command, (error, stdout) => {
      if (error) {
        // It's okay if this fails, it might mean no process is using the port
        resolve()
        return
      }

      if (!stdout) {
        resolve()
        return
      }

      const killCommand = isWindows
        ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /F /PID %a`
        : `lsof -i :${port} -t | xargs kill -9`

      exec(killCommand, (killError) => {
        if (killError) {
          console.error(`Failed to kill process on port ${port}: ${killError}`)
        } else {
          console.log(`BackendManager: Killed process on port ${port}`)
        }
        resolve()
      })
    })
  })
}

/**
 * Checks if the backend is running
 */
export function isRunning(): boolean {
  return isStarted && backendProcess !== null
}

/**
 * Get the backend port
 */
export function getPort(): number {
  return port
}
