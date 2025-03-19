import { createBackendRelayer } from "../../src/backend-relayer"
import { PingApi } from "./api-test"

const relayer = createBackendRelayer<PingApi>("ws://localhost:4001")
const result = await relayer.ping()
console.log(result)
await relayer.closeConnection()
