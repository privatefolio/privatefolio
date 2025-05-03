import { computed } from "nanostores"
import type { Api } from "privatefolio-backend/build/src/api/api"
import { createBackendRelayer } from "privatefolio-backend/build/src/backend-relayer"
import { TARGET } from "src/env"
import { ConnectionStatusCallback } from "src/interfaces"
import {
  $connectionErrorMessage,
  $connectionStatus,
  $isCloudAccount,
} from "src/stores/account-store"
import { $user, User } from "src/stores/cloud-account-store"
import { isProduction, isSecure } from "src/utils/environment-utils"

import { $auth, JWT_LOCAL_STORAGE_KEY } from "../stores/auth-store"

const BASE_LOCAL_SERVER_URL = isProduction
  ? TARGET === "electron"
    ? "localhost:5555"
    : window.location.hostname // self hosted
  : "localhost:4001"
const REMOTE_SERVER_URL = (user: User) => `cloud.privatefolio.app:${50000 + user.id}`

function getWebSocketUrl(baseServerUrl: string): string {
  const protocol = isSecure ? "wss" : "ws"
  let url = `${protocol}://${baseServerUrl}`
  let jwt: string | null = null

  try {
    jwt = localStorage.getItem(JWT_LOCAL_STORAGE_KEY)
  } catch (error) {
    console.error("Failed to get JWT from localStorage:", error)
  }
  if (jwt) {
    url += `?jwt=${encodeURIComponent(jwt)}`
  }
  return url
}

let currentConnectionId = 0

const createStatusHandler = (): ConnectionStatusCallback => {
  const connectionId = ++currentConnectionId

  return (status, errorMessage) => {
    if (connectionId === currentConnectionId) {
      $connectionStatus.set(status)
      $connectionErrorMessage.set(errorMessage)
    }
  }
}

export const $rest = computed([$isCloudAccount, $user], (isCloudAccount, user) => {
  const address = isCloudAccount
    ? `https://${REMOTE_SERVER_URL(user as User)}`
    : `${isSecure ? "https" : "http"}://${BASE_LOCAL_SERVER_URL}`

  return address
})

export const $localRpc = computed([$auth], () => {
  return createBackendRelayer<Api>(
    getWebSocketUrl(BASE_LOCAL_SERVER_URL),
    createStatusHandler(),
    !isProduction
  )
})

export const $rpc = computed(
  [$isCloudAccount, $user, $auth, $localRpc],
  (isCloudAccount, user, auth, localRpc) => {
    if (!auth.isAuthenticated) return localRpc

    if (isCloudAccount) {
      return createBackendRelayer<Api>(
        `wss://${REMOTE_SERVER_URL(user as User)}`,
        createStatusHandler(),
        !isProduction
      )
    } else {
      return localRpc
    }
  }
)

$rpc.subscribe((rpc) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prettier/prettier
  (window as any).rpc = rpc
})

// WEBWORKER remote
// import "./comlink-setup"

// import { Remote, wrap } from "comlink"

// import type { Clancy as BaseType } from "./clancy"

// const clancyWorker = new Worker(new URL("./clancy.ts", import.meta.url), {
//   name: "Clancy",
//   type: "module",
// })

// type Clancy = Omit<Remote<BaseType>, "getValue"> & {
//   getValue<T>(key: string, defaultValue: T | null, accountName?: string): Promise<T | null>
// }

// export const clancy = wrap(clancyWorker) as Clancy
