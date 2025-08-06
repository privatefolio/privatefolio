import "./error-catcher"
import "./logger-cron"

import { wrap } from "comlink"

import { Api, api as readApi } from "./api/api"
import { BackendServer } from "./backend-server"
import { setupServerCronJobs } from "./crons"
import { logger } from "./logger"
import { setupAllSideEffects } from "./side-effects"
import { telemetry } from "./telemetry"
import { isProduction } from "./utils/utils"

logger.info("Spawning worker thread")
const worker = new Worker(import.meta.resolve("./api-worker"), {
  env: {
    ALLOW_WRITES: "true",
    BUN_WORKER: "true",
    ...process.env,
  },
})

const writeApi = wrap<Api>(worker) as Api
const accountNames = await writeApi.getAccountNames()

async function getKioskMode() {
  let kioskMode = false
  for (const accountName of accountNames) {
    const accountSettings = await writeApi.getSettings(accountName)
    if (accountSettings.kioskMode) {
      kioskMode = true
      break
    }
  }
  return kioskMode
}

let server: BackendServer<Api>

async function startServer() {
  const kioskMode = await getKioskMode()
  server?.close()
  server = new BackendServer(readApi, writeApi, false, kioskMode, function shutdown() {
    logger.fatal("Shutting down server - fatal error")
    worker.terminate()
    telemetry.shutdown().finally()
    if (isProduction) process.exit()
  })

  const port = Number(process.env.PORT)
  server.start(isNaN(port) ? 4001 : port)
}

await writeApi.migrateServerDatabase()
await setupAllSideEffects(writeApi, startServer)
await setupServerCronJobs(writeApi)

await startServer()

process.on("SIGINT", async () => {
  logger.info("Shutting down server - SIGINT received")
  server.close()
  worker.terminate()
  await telemetry.shutdown()
  process.exit()
})
