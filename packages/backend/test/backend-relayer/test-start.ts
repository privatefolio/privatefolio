import { wrap } from "comlink"

import { BackendServer } from "../../src/backend-server"
import { TestApi, testApi as readApi } from "./test-api"

const worker = new Worker(import.meta.resolve("./test-api-worker.ts"))
const writeApi = wrap<TestApi>(worker)

const server = new BackendServer(readApi, writeApi, true)

server.start(4006)

process.on("SIGINT", () => {
  console.log("Shutting down server")
  server.close()
  worker.terminate()
  process.exit()
})
