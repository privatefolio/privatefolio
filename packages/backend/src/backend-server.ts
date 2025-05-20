import { Server, ServerWebSocket } from "bun"
import chalk from "chalk"
import { access } from "fs/promises"
import { join } from "path"

import { handleDownload, handlePreflight, handleUpload } from "./api/account/server-files-http-api"
import {
  handleLoginRequest,
  handleSetupRequest,
  handleStatusRequest,
  handleVerifyAuthRequest,
  isAuthSetupComplete,
  readSecrets,
} from "./api/auth-http-api"
import {
  BackendRequest,
  BackendResponse,
  FunctionInvocation,
  FunctionReference,
} from "./backend-comms"
import { APP_VERSION } from "./server-env"
import { corsHeaders } from "./settings"
import { extractJwt, verifyJwt } from "./utils/jwt-utils"

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
    // console.log(`Server starting on port ${port}.`)
    this.server = Bun.serve({
      async fetch(request, server) {
        const { method } = request
        const { pathname } = new URL(request.url)

        // Public endpoints
        if (method === "OPTIONS") return await handlePreflight()
        if (pathname === "/ping") return new Response("pong", { status: 200 })
        if (pathname === "/info") {
          return new Response(
            JSON.stringify({
              buildDate: process.env.GIT_DATE,
              commit: process.env.GIT_HASH,
              digest: process.env.GIT_HASH?.slice(0, 7),
              homepage: "https://privatefolio.app",
              name: "Privatefolio Backend",
              version: APP_VERSION,
            }),
            { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 200 }
          )
        }
        if (pathname === "/api/setup-status") {
          return handleStatusRequest()
        }
        if (pathname === "/api/setup" && method === "POST") {
          return handleSetupRequest(request)
        }
        if (pathname === "/api/login" && method === "POST") {
          return handleLoginRequest(request)
        }
        if (pathname === "/api/verify-auth" && method === "GET") {
          return handleVerifyAuthRequest(request)
        }

        // Authentication guard
        const setupCompleted = await isAuthSetupComplete()
        const jwt = extractJwt(request)
        let isAuthenticated = false

        if (setupCompleted && jwt) {
          const secrets = await readSecrets()
          const payload = await verifyJwt(jwt, secrets.jwtSecret)
          if (payload) {
            isAuthenticated = true
          } else {
            console.warn("Received invalid or expired authentication token.")
          }
        }

        const protectedRoutes = ["/download", "/upload"]
        if (!isAuthenticated) {
          if (protectedRoutes.includes(pathname)) {
            console.warn(`Blocked unauthenticated request to ${pathname}.`)
            return new Response("Unauthorized", { headers: corsHeaders, status: 401 })
          }
        }

        // Protected routes
        if (pathname === "/download") {
          return await handleDownload(request)
        }
        if (pathname === "/upload") {
          return await handleUpload(request)
        }

        // WebSocket upgrade check (protected)
        if (server.upgrade(request, { data: { isAuthenticated } })) return

        // Static file serving (public)
        try {
          const overridden = pathname === "/" ? "/index.html" : pathname
          const filePath = join(__dirname, "../../frontend/build", overridden)
          const file = Bun.file(filePath)
          await access(filePath)
          return new Response(file)
        } catch {
          try {
            const filePath = join(__dirname, "../../frontend/build/index.html")
            await access(filePath)
            return new Response(Bun.file(filePath))
          } catch {
            return new Response("Frontend bundle not found", { status: 404 })
          }
        }
      },
      port,
      websocket: {
        close() {
          // console.log("Connection closed.")
        },
        message: async (
          socket: ServerWebSocket<{ isAuthenticated?: boolean }>,
          message: string
        ) => {
          const { isAuthenticated } = socket.data

          if (!isAuthenticated) {
            console.warn("Connection denied: auth check failed.")
            socket.close(1008, "Unauthorized")
            return
          }

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
        open(socket: ServerWebSocket<{ isAuthenticated?: boolean }>) {
          if (!socket.data.isAuthenticated) {
            socket.close(1008, "Unauthorized")
            // return
          }
          // console.log("Connection opened. ")
        },
      },
    })

    console.log(chalk.bold.green(`Server started on port ${this.server.port}.`))
    console.log(
      chalk.green("➜ "),
      chalk.bold(`REST:`),
      chalk.bold.blue(
        `             http://localhost:${this.server.port}, http://localhost:${this.server.port}/info`
      )
    )
    console.log(
      chalk.green("➜ "),
      chalk.bold(`WebSockets:`),
      chalk.bold.blue(`         ws://localhost:${this.server.port}`)
    )
  }
}
