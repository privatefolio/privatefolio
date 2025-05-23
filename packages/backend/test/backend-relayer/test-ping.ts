import { proxy } from "comlink"

import { createBackendRelayer } from "../../src/backend-relayer"
import { TestApi } from "./test-api"

const relayer = createBackendRelayer<TestApi>("ws://localhost:4006", undefined, false)

console.log("Result", await relayer.ping())

console.log("Counter", await relayer.getCounter())
await relayer.increment()
await relayer.increment()
await relayer.increment()
console.log("Counter", await relayer.getCounter())

try {
  await relayer.throwError()
} catch {
  console.log("Error caught")
}

console.log("Type test result", await relayer.returnUndefined())

const myFunction = proxy(() => console.log("Hello from the other side!"))

const unsubscribeId = await relayer.subscribe(myFunction)
await relayer.unsubscribe(unsubscribeId)

relayer.closeConnection()
