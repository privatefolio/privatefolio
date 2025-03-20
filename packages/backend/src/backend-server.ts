import { Server } from "bun"
import chalk from "chalk"

import { handleDownload, handlePreflight, handleUpload } from "./api/account/server-files-http-api"
import {
  BackendRequest,
  BackendResponse,
  FunctionInvocation,
  FunctionReference,
} from "./backend-comms"
import { APP_VERSION } from "./server-env"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BackendApiShape = { [key: string]: (...params: any[]) => Promise<unknown> }

export class BackendServer<T extends BackendApiShape> {
  private apiMethods: T

  close() {
    this.server?.stop()
  }

  constructor(apiMethods: T) {
    this.apiMethods = apiMethods
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private functionRegistry: { [id: string]: Function } = {}
  private server?: Server

  start(port: number) {
    console.log(`Server starting on port ${port}.`)
    this.server = Bun.serve({
      async fetch(request, server) {
        const { method } = request
        const { pathname } = new URL(request.url)

        if (method === "OPTIONS") return await handlePreflight()
        if (pathname === "/ping") return new Response("pong", { status: 200 })
        if (pathname === "/download") return await handleDownload(request)
        if (pathname === "/upload") return await handleUpload(request)

        if (server.upgrade(request)) return

        if (pathname === "/")
          return new Response(
            JSON.stringify({
              buildDate: process.env.GIT_DATE,
              commit: process.env.GIT_HASH,
              digest: process.env.GIT_HASH?.slice(0, 7),
              homepage: "https://privatefolio.app",
              name: "Privatefolio Backend",
              version: APP_VERSION,
            }),
            { status: 200 }
          )
        return new Response("Not Found", { status: 404 })
      },
      port,
      websocket: {
        close() {
          console.log("Connection closed.")
        },
        message: async (socket, message) => {
          let response: BackendResponse
          let request: BackendRequest

          try {
            request = JSON.parse(message.toString()) as BackendRequest
          } catch (error) {
            response = { error: `Could not parse request ${String(error)}` }
            socket.send(JSON.stringify(response))
            return
          }

          try {
            const { id, method, params, functionId } = request
            // console.log("New request", request)

            const deserializedParams = params.map((param) => {
              if (typeof param === "object" && (param as FunctionReference).__isFunction) {
                return (...args: unknown[]) => {
                  socket.send(
                    JSON.stringify({
                      functionId: (param as FunctionReference).functionId,
                      params: args,
                    } as FunctionInvocation)
                  )
                }
              }
              if (param === "undefined") return undefined
              return param
            })

            if (functionId) {
              if (!this.functionRegistry[functionId]) {
                response = { error: `Function ${functionId} not found in registry` }
              }

              try {
                this.functionRegistry[functionId](...(params as unknown[]))
              } catch {
                console.error(`Error invoking server function ${functionId}`)
              }
              // console.log("Server function invocation result:", result)
              return
            }

            if (this.apiMethods[method]) {
              const result = await this.apiMethods[method](...deserializedParams)
              response = { id, method, result }
            } else {
              response = { error: `API method not found: ${method}`, id, method }
            }
          } catch (error) {
            console.error(error)
            response = {
              error: `Could not execute request ${String(error)}`,
              id: request.id,
            }
            if (error instanceof Error) response.stackTrace = error.stack
          }

          if (typeof response.result === "function") {
            const functionId = `server_func_${response.id}`
            this.functionRegistry[functionId] = response.result
            response.result = { __isFunction: true, functionId } as FunctionReference
          }

          socket.send(JSON.stringify(response))
        },
        open() {
          console.log("Connection opened.")
        },
      },
    })

    console.log(chalk.bold.green(`Server started on port ${this.server.port}.`))
    console.log(
      chalk.green("➜ "),
      chalk.bold(`REST:`),
      chalk.bold.blue(`             http://localhost:${this.server.port}`)
    )
    console.log(
      chalk.green("➜ "),
      chalk.bold(`WebSockets:`),
      chalk.bold.blue(`         ws://localhost:${this.server.port}`)
    )
  }
}
