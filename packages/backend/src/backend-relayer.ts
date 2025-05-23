/* eslint-disable @typescript-eslint/member-ordering */

import { BackendResponse, FunctionReference } from "./backend-comms"
import { ConnectionStatusCallback } from "./interfaces"
import { noop } from "./utils/utils"

let instanceCounter = 0

class BackendRelayer {
  private socket: WebSocket
  private requestIdCounter = 0
  private pendingRequests: { [id: number]: (value: unknown) => void } = {}
  // eslint-disable-next-line @typescript-eslint/ban-types
  private functionRegistry: { [id: string]: Function } = {}
  private logResponses: boolean
  public readonly address: string
  private logPrefix: string
  private closedByUser = false
  public readonly id: number

  constructor(
    address: string,
    onStatusChange: ConnectionStatusCallback,
    logResponses: boolean,
    logPrefix: string
  ) {
    this.id = ++instanceCounter
    this.logPrefix = `BackendRelayer #${this.id} (${logPrefix})`
    this.logResponses = logResponses
    this.address = address
    this.socket = this.connect(address, onStatusChange)
  }

  private connect(address: string, onStatusChange: ConnectionStatusCallback): WebSocket {
    const baseAddress = address.substring(0, address.indexOf("?"))

    console.log(this.logPrefix, "connecting", baseAddress)

    const socket = new WebSocket(address)
    socket.addEventListener("message", (event) => {
      try {
        const response = JSON.parse(event.data) as BackendResponse
        const { id, result, error, stackTrace, functionId, params } = response
        if (this.logResponses) {
          console.log(this.logPrefix, "RPC: New response", response)
        }

        if (functionId) {
          if (!this.functionRegistry[functionId])
            throw new Error(`Function ${functionId} not found in registry`)

          // Handle function invocation
          try {
            this.functionRegistry[functionId](...(params as unknown[]))
          } catch {
            console.error(this.logPrefix, `Error invoking client function ${functionId}`)
          }
          return
        }

        if (id === undefined) {
          throw new Error(`Message: ${String(event.data)}`)
        }

        if (this.pendingRequests[id]) {
          if (error) {
            const err = new Error(error)
            err.stack = stackTrace
            this.pendingRequests[id](Promise.reject(err))
            if (this.logResponses) console.error(this.logPrefix, err)
          } else {
            let deserializedResult = result
            if (result && (result as FunctionReference).__isFunction) {
              deserializedResult = (...params: unknown[]) => {
                if (this.socket.readyState === WebSocket.OPEN) {
                  this.socket.send(
                    JSON.stringify({
                      functionId: (result as FunctionReference).functionId,
                      params,
                    })
                  )
                }
              }
            }

            this.pendingRequests[id](Promise.resolve(deserializedResult))
          }
          delete this.pendingRequests[id]
        }
      } catch (error) {
        if (this.logResponses) console.error(this.logPrefix, "failure:", error)
      }
    })

    socket.addEventListener("open", () => {
      console.log(this.logPrefix, "connected", baseAddress)
      onStatusChange("connected")
    })
    socket.addEventListener("close", (event) => {
      let reason = event.reason || "unknown"
      if (event.code === 1006 && reason === "unknown") {
        reason = "Server offline."
      }
      console.log(this.logPrefix, "closed:", event.code, reason, baseAddress)
      onStatusChange("closed", `${event.code}: ${reason}`)
      if (this.closedByUser) return
      if (event.code !== 1008) {
        setTimeout(() => {
          this.socket = this.connect(address, onStatusChange)
        }, 1_000)
      }
    })
    socket.addEventListener("error", (event) => {
      console.error(this.logPrefix, "error:", event, baseAddress)
    })

    return socket
  }

  public async requestFromBackend(method: string, params: unknown[]): Promise<unknown> {
    await this.ensureConnection()
    //
    const id = this.requestIdCounter++
    const serializedParams = params.map((param, paramIndex) => {
      if (typeof param === "function") {
        const functionId = `client_func_${id}_${paramIndex}`
        this.functionRegistry[functionId] = param
        return { __isFunction: true, functionId } as FunctionReference
      }
      if (typeof param === "undefined") {
        return "undefined"
      }
      return param
    })

    return new Promise((resolve) => {
      this.pendingRequests[id] = resolve
      this.socket.send(JSON.stringify({ id, method, params: serializedParams }))
    })
  }

  public async ensureConnection(): Promise<void> {
    if (this.socket.readyState === WebSocket.OPEN) return
    if (this.closedByUser) throw new Error("Connection closed by user")

    return new Promise((resolve) => {
      this.socket.addEventListener("open", () => resolve())
    })
  }

  public closeConnection() {
    try {
      this.closedByUser = true
      if (
        this.socket &&
        this.socket.readyState !== WebSocket.CLOSING &&
        this.socket.readyState !== WebSocket.CLOSED
      ) {
        this.socket.close(1000, "Client closed connection")
      }

      // Clean up pending requests to prevent memory leaks
      Object.values(this.pendingRequests).forEach((reject) =>
        reject(new Error("Connection closed"))
      )
      this.pendingRequests = {}
    } catch {
      // Ignore errors
    }
  }
}

export type IBackendRelayer = InstanceType<typeof BackendRelayer>

export function createBackendRelayer<T extends object>(
  address: string,
  onStatusChange: ConnectionStatusCallback = noop,
  logResponses = true,
  logPrefix = ""
): T & BackendRelayer {
  const relayer = new BackendRelayer(address, onStatusChange, logResponses, logPrefix)

  return new Proxy(relayer, {
    get: (target, property) => {
      if (typeof property === "string" && !(property in target)) {
        return async (...args: unknown[]) => {
          return target.requestFromBackend(property, args)
        }
      }
      return target[property]
    },
  }) as T & BackendRelayer
}
