import { expose } from "comlink"

import { testApi } from "./test-api"

expose(testApi)
console.log("Bun worker initialized.")
