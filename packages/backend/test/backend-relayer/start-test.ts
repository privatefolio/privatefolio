import { BackendServer } from "../../src/backend-server"
import { pingApi } from "./api-test"

const server = new BackendServer(pingApi)

server.start(4001)

process.on("SIGINT", () => {
  console.log("Shutting down server")
  server.close()
})
