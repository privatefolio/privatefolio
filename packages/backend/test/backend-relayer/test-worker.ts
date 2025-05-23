import { proxy, wrap } from "comlink"

import { TestApi } from "./test-api"

const worker = new Worker(import.meta.resolve("./test-api-worker.ts"))
const api = wrap<TestApi>(worker)

console.log(`Result: ${await api.ping()}`)
await api.increment()
await api.increment()
await api.increment()
console.log(`Result: ${await api.getCounter()}`)

try {
  await api.throwError()
} catch {
  console.log("Error caught")
}

// TODO5 BROKEN because workers cannot send functions back to the main thread: https://github.com/oven-sh/bun/issues/17039
// const unsubscribe = await api.subscribe(proxy(() => console.log("Hello from the other side!")))
// unsubscribe()

const unsubscribeId = await api.subscribe(proxy(() => console.log("Hello from the other side!")))
await api.unsubscribe(unsubscribeId)

worker.terminate()
