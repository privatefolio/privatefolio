import { BackendApiShape } from "src/backend-server"
import { sleep } from "src/utils/utils"

let counter = 0

export const testApi = {
  getCounter: async () => counter,
  increment: async () => {
    counter++
  },
  ping: async () => "pong",
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  returnUndefined: async (): Promise<void> => {},
  // TODO5 BROKEN because workers cannot send functions back to the main thread: https://github.com/oven-sh/bun/issues/17039
  // subscribe: async (callback: () => void) => {
  //   callback()
  //   return proxy(() => {
  //     console.log("Unsubscribed")
  //     return true
  //   })
  // },
  subscribe: async (callback: () => void) => {
    console.log("Subscribed")
    // trigger subscription
    callback()
    // return subscription id
    return "mySubId"
  },
  throwError: async (): Promise<string> => {
    await sleep(200)
    throw new Error("Oooops")
  },
  unsubscribe: async (id: string) => {
    if (id === "mySubId") {
      console.log("Unsubscribed:", id)
    } else {
      console.log("Subscription not found: ", id)
    }
  },
} satisfies BackendApiShape

export type TestApi = typeof testApi
