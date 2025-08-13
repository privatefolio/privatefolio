import { ChildProcess, exec, spawn } from "child_process"
import path from "path"

import { environment, isWindows } from "./environment-utils"
import { logAndReportError } from "./error-utils"
import { logger } from "./logger"
import { DATA_LOCATION, SERVER_PORT as port } from "./settings"

let backendProcess: ChildProcess | null = null
let isStarted = false

/**
 * Starts the backend server
 */
export async function start(): Promise<void> {
  if (isStarted) {
    logger.info("BackendManager: Backend is already running")
    return
  }

  logger.info("BackendManager: Starting backend server...")

  try {
    // Kill any existing process on the port before starting
    await killProcessOnPort()

    const bunPath = path.join(
      __dirname,
      "..",
      "..",
      // "..",
      // "app.asar.unpacked",
      "resources",
      "bun-sh",
      isWindows ? "privatefolio.exe" : "privatefolio"
    )
    logger.info(`BackendManager: Using bun path: ${bunPath}`)

    const entrypoint = path.join(
      __dirname,
      "..",
      "node_modules",
      "privatefolio-backend",
      "build",
      "bundles",
      "bun.mjs"
    )

    logger.info(`BackendManager: Starting with entrypoint: ${entrypoint}`)
    logger.info(`BackendManager: Using data location: ${DATA_LOCATION}`)

    const env = {
      ...process.env,
      // TODO2
      APP_VERSION: "0.2.0",
      DATA_LOCATION,
      GIT_DATE: new Date().toISOString(),
      GIT_HASH: "N/A",
      NODE_ENV: environment,
      PORT: port.toString(),
    }

    // Spawn the backend process
    backendProcess = spawn(bunPath, [entrypoint], {
      cwd: __dirname,
      env,
      stdio: "pipe", // Redirect stdout and stderr
    })

    backendProcess.stdout!.on("data", (data) => {
      const str = data.toString()
      console.log(`BackendManager: stdout: ${str.endsWith("\n") ? str.slice(0, -1) : str}`)
    })

    backendProcess.stderr!.on("data", (data) => {
      const str = data.toString()
      console.error(`BackendManager: stderr: ${str.endsWith("\n") ? str.slice(0, -1) : str}`)
    })

    backendProcess.on("error", (error) => {
      logAndReportError(error, `BackendManager: process error`)
      isStarted = false
    })

    backendProcess.on("exit", (code) => {
      logger.info(`BackendManager: Process exited with code ${code}`)
      isStarted = false
      backendProcess = null
    })

    // Set a flag to indicate the backend is running
    isStarted = true
    logger.info(`BackendManager: Started on port ${port}`)
  } catch (error) {
    logAndReportError(error as Error, `BackendManager: failed to start`)
    throw error
  }
}

/**
 * Stops the backend server
 */
export async function stop(): Promise<void> {
  logger.info("BackendManager: Stopping server...")

  if (!backendProcess) {
    logger.info("BackendManager: No process to stop")
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
  logger.info("BackendManager: Server stopped")
}

/**
 * Kill any process running on the backend port
 */
async function killProcessOnPort(): Promise<void> {
  return new Promise<void>((resolve) => {
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
          logAndReportError(killError, `Failed to kill process on port ${port}`)
        } else {
          logger.info(`BackendManager: Killed process on port ${port}`)
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
