// import "./comlink-setup"

import { expose } from "comlink"

import { api } from "./api/api"
// import { api as rawApi } from "./api/api"

// const api = new Proxy(rawApi, {
//   get(api, method: string) {
//     const orig = (api as unknown)[method]
//     return async (...args: unknown[]) => {
//       try {
//         return await orig.apply(api, args)
//       } catch (err) {
//         console.error(`[Worker] Error in ${method} ${String(err)}`)
//         // return "Something went wrong"
//         throw err
//       }
//     }
//   },
// })

expose(api)
console.log("Bun worker initialized.")
