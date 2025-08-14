import { computed } from "nanostores"
import type { Api } from "privatefolio-backend/build/src/api/api"
import type { IBackendRelayer } from "privatefolio-backend/build/src/backend-relayer"
import { createBackendRelayer } from "privatefolio-backend/build/src/backend-relayer"
import { User } from "src/api/privatecloud-api"
import { SERVER_PORT, TARGET } from "src/env"
import { ConnectionStatusCallback } from "src/interfaces"
import {
  $activeAccountType,
  $cloudConnectionStatus,
  $cloudConnectionStatusText,
  $localConnectionStatus,
  $localConnectionStatusText,
} from "src/stores/account-store"
import { $cloudRpcReady, $cloudServerInfo, $cloudUser } from "src/stores/cloud-user-store"
import { backendUrl } from "src/utils/electron-utils"
import { isProduction, isSecure, localServerEnabled } from "src/utils/environment-utils"

import { $localAuth } from "../stores/auth-store"

const LOCAL_JWT_STORATE_KEY = "privatefolio_jwt"
const CLOUD_JWT_STORATE_KEY = "privatecloud_instance_jwt"

const BASE_LOCAL_SERVER_URL =
  TARGET === "electron"
    ? backendUrl!
    : isProduction
      ? `${window.location.hostname}:${window.location.port}` // self hosted
      : `${window.location.hostname}:${SERVER_PORT}`
const REMOTE_SERVER_URL = (cloudAccount: User) => `${cloudAccount.id}.privatefolio.app`

function getWebSocketUrl(baseServerUrl: string, jwtKey: string): string {
  const protocol = isSecure ? "wss" : "ws"
  let url = `${protocol}://${baseServerUrl}`
  const jwt = localStorage.getItem(jwtKey)
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
      if ($localConnectionStatus.get() !== status) {
        $localConnectionStatus.set(status)
      }
      if ($localConnectionStatusText.get() !== errorMessage) {
        $localConnectionStatusText.set(errorMessage)
      }
    }
  }
}

let currentCloudConnectionId = 0

const createCloudStatusHandler = (): ConnectionStatusCallback => {
  const connectionId = ++currentCloudConnectionId

  return (status, errorMessage) => {
    if (connectionId !== currentCloudConnectionId) return
    if ($cloudConnectionStatus.get() !== status) {
      $cloudConnectionStatus.set(status)
    }
    if ($cloudConnectionStatusText.get() !== errorMessage) {
      $cloudConnectionStatusText.set(errorMessage)
    }
  }
}

export type RestConfig = {
  baseUrl: string
  jwtKey: string
}

export const $localRest = computed([], () => {
  if (!localServerEnabled) return null

  return {
    baseUrl: `${isSecure ? "https" : "http"}://${BASE_LOCAL_SERVER_URL}`,
    jwtKey: LOCAL_JWT_STORATE_KEY,
  } as RestConfig
})

export type RPC = Api & IBackendRelayer

let latestLocalRpc: RPC | null = null
let latestCloudRpc: RPC | null = null

export const $localRpc = computed([$localAuth], () => {
  if (!localServerEnabled) return null

  const newAddress = getWebSocketUrl(BASE_LOCAL_SERVER_URL, LOCAL_JWT_STORATE_KEY)
  if (latestLocalRpc && latestLocalRpc.address === newAddress) return latestLocalRpc

  if (latestLocalRpc) latestLocalRpc.closeConnection()

  latestLocalRpc = createBackendRelayer<Api>(
    newAddress,
    createLocalStatusHandler(),
    !isProduction,
    "Local"
  )
  return latestLocalRpc
})

export const $cloudRest = computed([$cloudUser, $cloudServerInfo], (cloudUser, cloudServerInfo) => {
  if (!cloudUser) return null
  if (!cloudServerInfo) return null

  return {
    baseUrl: `https://${REMOTE_SERVER_URL(cloudUser)}`,
    jwtKey: CLOUD_JWT_STORATE_KEY,
  } as RestConfig
})

export const $rest = computed(
  [$activeAccountType, $localRest, $cloudRest],
  (accountType, localRest, cloudRest) => {
    if (accountType === "cloud") {
      return cloudRest ?? (localRest as RestConfig)
    } else {
      return localRest as RestConfig
    }
  }
)

export const $cloudRpc = computed([$cloudUser, $cloudRpcReady], (cloudUser, cloudRpcReady) => {
  if (latestCloudRpc && (!cloudUser || !cloudRpcReady)) {
    latestCloudRpc.closeConnection()
    latestCloudRpc = null
    return null
  }
  if (!cloudUser) return null
  if (!cloudRpcReady) return null

  const newAddress = getWebSocketUrl(REMOTE_SERVER_URL(cloudUser), CLOUD_JWT_STORATE_KEY)
  if (latestCloudRpc && latestCloudRpc.address === newAddress) return latestCloudRpc

  if (latestCloudRpc) latestCloudRpc.closeConnection()

  latestCloudRpc = createBackendRelayer<Api>(
    newAddress,
    createCloudStatusHandler(),
    !isProduction,
    "Cloud"
  )
  return latestCloudRpc
})

export const $rpc = computed(
  [$activeAccountType, $localRpc, $cloudRpc],
  (accountType, localRpc, cloudRpc) => {
    if (accountType === "cloud") {
      return cloudRpc ?? (localRpc as RPC)
    } else {
      return localRpc as RPC
    }
  }
)

// logAtoms({ $rpc })

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
