/* eslint-disable @typescript-eslint/member-ordering */

import { BackendResponse, FunctionReference } from "./backend-comms"
import { ConnectionStatusCallback } from "./interfaces"
import { noop } from "./utils/utils"

class BackendRelayer {
  private socket: WebSocket
  private requestIdCounter = 0
  private pendingRequests: { [id: number]: (value: unknown) => void } = {}
  // eslint-disable-next-line @typescript-eslint/ban-types
  private functionRegistry: { [id: string]: Function } = {}
  private logResponses: boolean

  constructor(address: string, onStatusChange: ConnectionStatusCallback, logResponses: boolean) {
    this.socket = this.connect(address, onStatusChange)
    this.logResponses = logResponses
  }

  private connect(address: string, onStatusChange: ConnectionStatusCallback): WebSocket {
    console.log("BackendRelayer connecting", address)

    const socket = new WebSocket(address)
    socket.addEventListener("message", (event) => {
      try {
        const response = JSON.parse(event.data) as BackendResponse
        const { id, result, error, stackTrace, functionId, params } = response
        if (this.logResponses) {
          console.log("RPC: New response", response)
        }

        if (functionId) {
          if (!this.functionRegistry[functionId])
            throw new Error(`Function ${functionId} not found in registry`)

          // Handle function invocation
          try {
            this.functionRegistry[functionId](...(params as unknown[]))
          } catch {
            console.error(`Error invoking client function ${functionId}`)
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
            console.error(err)
          } else {
            let deserializedResult = result
            if (result && (result as FunctionReference).__isFunction) {
              deserializedResult = (...params: unknown[]) => {
                this.socket.send(
                  JSON.stringify({
                    functionId: (result as FunctionReference).functionId,
                    params,
                  })
                )
              }
            }

            this.pendingRequests[id](Promise.resolve(deserializedResult))
          }
          delete this.pendingRequests[id]
        }
      } catch (error) {
        console.error("BackendRelayer failure:", error)
      }
    })

    socket.addEventListener("open", () => {
      console.log("BackendRelayer connected", address)
      onStatusChange("connected")
    })
    socket.addEventListener("close", () => {
      console.log("BackendRelayer closed", address)
      onStatusChange("closed")
      setTimeout(() => {
        this.socket = this.connect(address, onStatusChange)
      }, 1_000)
    })
    socket.addEventListener("error", (error) => {
      console.error("BackendRelayer error:", error, address)
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

    return new Promise((resolve) => {
      this.socket.addEventListener("open", () => resolve())
    })
  }

  public async closeConnection(): Promise<void> {
    return new Promise((resolve) => {
      this.socket.close()
      resolve()
    })
  }
}

export function createBackendRelayer<T extends object>(
  address: string,
  onStatusChange: ConnectionStatusCallback = noop,
  logResponses = true
): T & BackendRelayer {
  const relayer = new BackendRelayer(address, onStatusChange, logResponses)

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
