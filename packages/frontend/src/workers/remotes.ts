import { computed } from "nanostores"
import type { Api } from "privatefolio-backend/build/src/api/api"
import { createBackendRelayer } from "privatefolio-backend/build/src/backend-relayer"
import { User } from "src/api/privatecloud-api"
import { TARGET } from "src/env"
import { ConnectionStatusCallback } from "src/interfaces"
import {
  $cloudConnectionStatus,
  $cloudConnectionStatusText,
  $isCloudAccount,
  $localConnectionStatus,
  $localConnectionStatusText,
} from "src/stores/account-store"
import { $cloudUser } from "src/stores/cloud-user-store"
import { isProduction, isSecure } from "src/utils/environment-utils"

import { $localAuth } from "../stores/auth-store"

const LOCAL_JWT_STORATE_KEY = "privatefolio_jwt"
const CLOUD_JWT_STORATE_KEY = "privatecloud-jwt"

const BASE_LOCAL_SERVER_URL = isProduction
  ? TARGET === "electron"
    ? "localhost:5555"
    : window.location.hostname // self hosted
  : "localhost:4001"
const REMOTE_SERVER_URL = (cloudAccount: User) => `${cloudAccount.id}.privatefolio.app`

function getWebSocketUrl(baseServerUrl: string, jwtKey: string): string {
  const protocol = isSecure ? "wss" : "ws"
  let url = `${protocol}://${baseServerUrl}`
  let jwt: string | null = null

  try {
    jwt = localStorage.getItem(jwtKey)
  } catch (error) {
    console.error("Failed to get JWT from localStorage:", error)
  }
  if (jwt) {
    url += `?jwt=${encodeURIComponent(jwt)}`
  }
  return url
}

let currentLocalConnectionId = 0

const createLocalStatusHandler = (): ConnectionStatusCallback => {
  const connectionId = ++currentLocalConnectionId

  return (status, errorMessage) => {
    if (connectionId === currentLocalConnectionId) {
      $localConnectionStatus.set(status)
      $localConnectionStatusText.set(errorMessage ?? undefined)
    }
  }
}

let currentCloudConnectionId = 0

const createCloudStatusHandler = (): ConnectionStatusCallback => {
  const connectionId = ++currentCloudConnectionId

  return (status, errorMessage) => {
    if (connectionId === currentCloudConnectionId) {
      $cloudConnectionStatus.set(status)
      $cloudConnectionStatusText.set(errorMessage ?? undefined)
    }
  }
}

export type RestConfig = {
  baseUrl: string
  jwtKey: string
}

export const $localRest = computed([], () => {
  return {
    baseUrl: `${isSecure ? "https" : "http"}://${BASE_LOCAL_SERVER_URL}`,
    jwtKey: LOCAL_JWT_STORATE_KEY,
  } as RestConfig
})

export const $localRpc = computed([$localAuth], () => {
  return createBackendRelayer<Api>(
    getWebSocketUrl(BASE_LOCAL_SERVER_URL, LOCAL_JWT_STORATE_KEY),
    createLocalStatusHandler(),
    !isProduction,
    "Local"
  )
})

export const $cloudRest = computed([$cloudUser], (cloudUser) => {
  if (!cloudUser) return null

  return {
    baseUrl: `https://${REMOTE_SERVER_URL(cloudUser)}`,
    jwtKey: CLOUD_JWT_STORATE_KEY,
  } as RestConfig
})

export const $rest = computed(
  [$isCloudAccount, $localRest, $cloudRest],
  (isCloudAccount, localRest, cloudRest) => {
    if (isCloudAccount) {
      return cloudRest ?? localRest
    } else {
      return localRest
    }
  }
)

export const $cloudRpc = computed([$cloudUser], (cloudUser) => {
  if (!cloudUser) return null

  return createBackendRelayer<Api>(
    getWebSocketUrl(REMOTE_SERVER_URL(cloudUser), CLOUD_JWT_STORATE_KEY),
    createCloudStatusHandler(),
    !isProduction,
    "Cloud"
  )
})

export const $rpc = computed(
  [$isCloudAccount, $localRpc, $cloudRpc],
  (isCloudAccount, localRpc, cloudRpc) => {
    if (isCloudAccount) {
      return cloudRpc ?? localRpc
    } else {
      return localRpc
    }
  }
)

$rpc.subscribe((rpc) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prettier/prettier
  (window as any).rpc = rpc
})

$localRpc.subscribe((rpc) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prettier/prettier
  (window as any).localRpc = rpc
})

$cloudRpc.subscribe((rpc) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prettier/prettier
  (window as any).cloudRpc = rpc
})

$rest.subscribe((rest) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prettier/prettier
  (window as any).rest = rest
})

$localRest.subscribe((rest) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prettier/prettier
  (window as any).localRest = rest
})

$cloudRest.subscribe((rest) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prettier/prettier
  (window as any).cloudRest = rest
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
