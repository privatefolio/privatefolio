// import "./comlink-setup"

import { Server, ServerWebSocket } from "bun"
import chalk from "chalk"
import { proxy } from "comlink"
import { access } from "fs/promises"
import { join } from "path"

import { handleAssistantChat } from "./api/account/assistant-http-api"
import { handleDownload, handlePreflight, handleUpload } from "./api/account/server-files-http-api"
import { Api } from "./api/api"
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
import { corsHeaders } from "./settings/settings"
import { extractJwt, verifyJwt } from "./utils/jwt-utils"

// Disallow functions because of bun worker bug
export type Serializable = string | number | boolean | null | void | object | object[]

export type BackendApiShape = { [key: string]: (...params: unknown[]) => Promise<Serializable> }

export class BackendServer<T extends BackendApiShape> {
  private _authDisabled: boolean
  private _kioskMode: boolean
  private _requestShutdown?: () => void

  close() {
    this.server?.stop()
  }

  constructor(
    readApi: T,
    writeApi?: T,
    authDisabled = false,
    kioskMode = false,
    requestShutdown?: () => void
  ) {
    this.readApi = readApi
    this.writeApi = writeApi
    this._authDisabled = authDisabled
    this._kioskMode = kioskMode
    this._requestShutdown = requestShutdown
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private functionRegistry: { [id: string]: Function } = {}
  private readApi: T
  private server?: Server

  start(port: number) {
    const authDisabled = this._authDisabled
    const kioskMode = this._kioskMode
    const writeApi = this.writeApi
    console.log(`Server starting on port ${port}. Kiosk mode ${kioskMode ? "enabled" : "disabled"}`)
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
              homepage: "https://privatefolio.xyz",
              name: "Privatefolio Backend",
              version: APP_VERSION,
            }),
            { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 200 }
          )
        }
        if (pathname === "/api/setup-status") {
          return handleStatusRequest(kioskMode)
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
        let isAuthenticated = !!authDisabled

        if (setupCompleted && jwt && !authDisabled) {
          const secrets = await readSecrets()
          const payload = await verifyJwt(jwt, secrets.jwtSecret)
          if (payload) {
            isAuthenticated = true
          } else {
            console.warn("Received invalid or expired authentication token.")
          }
        }

        const protectedRoutes = ["/download", "/upload", "/assistant-chat"]
        if (!isAuthenticated && protectedRoutes.includes(pathname)) {
          console.warn(`Blocked unauthenticated request to ${pathname}.`)
          return new Response("Login or sign up to continue.", {
            headers: corsHeaders,
            status: 401,
          })
        }

        // Protected routes
        if (pathname === protectedRoutes[0]) {
          return await handleDownload(request, writeApi as unknown as Api)
        }
        if (pathname === protectedRoutes[1]) {
          return await handleUpload(request, writeApi as unknown as Api)
        }
        if (pathname === protectedRoutes[2]) {
          return await handleAssistantChat(request, writeApi as unknown as Api)
        }

        // WebSocket upgrade check (protected)
        if (server.upgrade(request, { data: { isAuthenticated, kioskMode } })) return

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
      idleTimeout: 0, // TODO7 disabled https://github.com/oven-sh/bun/issues/15589
      port,
      websocket: {
        close() {
          // console.log("Connection closed.")
        },
        message: async (
          socket: ServerWebSocket<{ isAuthenticated?: boolean; kioskMode?: boolean }>,
          message: string
        ) => {
          const { isAuthenticated, kioskMode } = socket.data

          if (!isAuthenticated && !kioskMode) {
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
            // console.log("RPC: New request", request)

            const isReadMethod =
              method.startsWith("read") ||
              method.startsWith("get") ||
              method.startsWith("count") ||
              !this.writeApi

            const isSubcribeMethod = method.startsWith("subscribe")

            // In kiosk mode, only allow read operations without auth
            if (kioskMode && !isAuthenticated && !isReadMethod && !isSubcribeMethod) {
              response = {
                error: "Login or sign up to continue.",
                id,
                method,
              }
              socket.send(JSON.stringify(response))
              return
            }

            const deserializedParams = params.map((param) => {
              if (typeof param === "object" && (param as FunctionReference).__isFunction) {
                const callback = (...args: unknown[]) => {
                  socket.send(
                    JSON.stringify({
                      functionId: (param as FunctionReference).functionId,
                      params: args,
                    } as FunctionInvocation)
                  )
                }
                return isReadMethod ? callback : proxy(callback)
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

            if (!this.readApi[method]) {
              response = { error: `API method not found: ${method}`, id, method }
            } else if (isReadMethod) {
              // console.log(`Forwarding method ${method} to ${chalk.bold.blue("readApi")}`)
              const result = await this.readApi[method](...deserializedParams)
              response = { id, method, result }
            } else {
              // console.log(`Forwarding method ${method} to ${chalk.bold.yellow("writeApi")}`)
              const result = await this.writeApi[method](...deserializedParams)
              response = { id, method, result }
            }
          } catch (error) {
            console.warn(
              `${chalk.yellow.bold("[warn]")} Failed to execute request "${request.method}" ${String(error)}`
            )
            if (error.message.includes("Worker has been terminated")) {
              console.error("[error] Shutting down server due to invalid worker state")
              this.server?.stop()
              this._requestShutdown?.()
              return
            }
            response = {
              error: `Could not execute request "${request.method}" ${String(error)}`,
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
        open(socket: ServerWebSocket<{ isAuthenticated?: boolean; kioskMode?: boolean }>) {
          if (!socket.data.isAuthenticated && !socket.data.kioskMode) {
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

  private writeApi?: T
}
