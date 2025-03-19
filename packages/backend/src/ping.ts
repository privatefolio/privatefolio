import { Api } from "./api/api"
import { createBackendRelayer } from "./backend-relayer"

const relayer = createBackendRelayer<Api>("ws://localhost:4001")
const result = await relayer.ping()
console.log(result)
await relayer.closeConnection()
