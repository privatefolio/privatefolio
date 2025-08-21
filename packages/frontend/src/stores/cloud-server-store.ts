import { atom, computed } from "nanostores"
import { enqueueSnackbar } from "notistack"
import {
  authenticate,
  CloudInstance,
  createCloudInstance,
  createUser,
  getCloudInstance,
  getSubscription,
  logout,
  patchCloudInstance,
  reAuthenticate,
  removeCloudInstance,
  Subscription,
  User,
} from "src/api/privatecloud-api"
import { logAtoms } from "src/utils/browser-utils"
import { cloudEnabled, isProduction } from "src/utils/environment-utils"
import { logAndReportError } from "src/utils/error-utils"
import { setIfChanged } from "src/utils/store-utils"
import { sleep } from "src/utils/utils"
import { $cloudRest } from "src/workers/remotes"

import { $cloudConnectionStatus } from "./account-store"
import { $cloudAuth, checkAuthentication, setPassword, unlockApp } from "./auth-store"

export type ServerInfo = {
  buildDate: string
  commit: string
  digest: string
  homepage: string
  name: string
  version: string
}

export const $cloudUser = atom<User | null | undefined>()
export const $cloudSubscription = atom<Subscription | null | undefined>()
export const $cloudPortalLink = atom<string | null | undefined>()
export const $cloudInstance = atom<CloudInstance | null | undefined>()
export const $cloudServerInfo = atom<ServerInfo | null | undefined>()
export const $cloudServerMutating = atom<boolean>(false)

export const $cloudAvailable = computed([$cloudUser, $cloudInstance], (user, instance) => {
  return !!user && !!instance
})

export const $cloudRpcReady = computed([$cloudAuth], (auth) => {
  if (!auth.checked) return undefined
  return auth.checked && auth.isAuthenticated && !auth.needsSetup
})

$cloudConnectionStatus.listen((status) => {
  if (status === "closed") {
    checkCloudServerInfo()
    checkAuthentication($cloudAuth, $cloudRest.get())
  }
})

logAtoms({
  $cloudAvailable,
  $cloudInstance,
  $cloudRpcReady,
  $cloudServerInfo,
  $cloudSubscription,
  $cloudUser,
})

export async function checkCloudUser() {
  if (!cloudEnabled) return
  if (!isProduction) console.log("PrivateCloud -", "checking auth")
  try {
    const user = await reAuthenticate()
    $cloudUser.set(user)
  } catch {
    $cloudUser.set(null)
  }
}

export async function checkSubscription() {
  if (!isProduction) console.log("PrivateCloud -", "checking service subscription")
  return getSubscription()
    .then((sub) => {
      setIfChanged($cloudSubscription, sub)
    })
    .catch((err) => {
      logAndReportError(err as Error, "Error fetching cloud subscription")
      $cloudSubscription.set(null)
      enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
    })
}

export async function checkCloudInstance() {
  if (!isProduction) console.log("PrivateCloud -", "checking cloud instance")
  return getCloudInstance()
    .then($cloudInstance.set)
    .catch((err) => {
      logAndReportError(err as Error, "Error fetching cloud server info")
      $cloudInstance.set(null)
      enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
    })
}

export async function checkCloudServerInfo() {
  const user = $cloudUser.get()
  const instance = $cloudInstance.get()

  if ((!user || !instance) && $cloudServerInfo.get() !== null) {
    $cloudServerInfo.set(null)
    return
  }
  if (!user || !instance) return

  return fetch(`https://${user.id}.privatefolio.app/info`)
    .then((res) => res.json())
    .then((info) => {
      setIfChanged($cloudServerInfo, info)
    })
    .catch((err: Error) => {
      console.warn("Error fetching cloud server info:", err)
      if ($cloudServerInfo.get() === undefined) $cloudServerInfo.set(null)
      // enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
    })
}

export async function handleLogin(email: string, password: string, createInstance = false) {
  const user = await authenticate(email, password)
  $cloudUser.set(user)

  if (createInstance) {
    setTimeout(async () => {
      await handleCreateServer()
    }, 1_000)
  }

  setTimeout(
    async () => {
      const maxAttempts = 60
      const interval = 1_000
      let attempts = 0
      while (attempts < maxAttempts) {
        if (!$cloudInstance.get() || !$cloudRest.get()) {
          if (!isProduction)
            console.log("PrivateCloud - waiting for cloud instance and rest config to be set...")
          await sleep(interval)
          attempts++
          continue
        }

        if (!isProduction) console.log("PrivateCloud - unlocking instance...")
        await unlockApp(password, $cloudAuth, $cloudRest.get())
        break
      }
    },
    createInstance ? 10_000 : 1_000
  )
}

export async function handleLogout() {
  await logout()
  $cloudUser.set(null)
}

export async function handleSignUp(email: string, password: string) {
  await createUser(email, password)
  await handleLogin(email, password, true)
}

export async function handleCreateServer() {
  try {
    $cloudServerMutating.set(true)
    const cloudInstance = await createCloudInstance()
    $cloudInstance.set(cloudInstance)
    enqueueSnackbar(`Cloud server created`)
  } catch (err) {
    enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
  } finally {
    $cloudServerMutating.set(false)
  }
}

export async function handleUnpauseServer() {
  try {
    $cloudServerMutating.set(true)
    const serverId = $cloudInstance.get()?.id
    if (!serverId) {
      logAndReportError(new Error("No server ID found"), "handleUnpauseServer")
      return
    }
    const cloudInstance = await patchCloudInstance(serverId, { action: "unpause" })
    $cloudInstance.set(cloudInstance)
    enqueueSnackbar(`Cloud server unpaused`)
  } catch (err) {
    enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
  } finally {
    $cloudServerMutating.set(false)
  }
}

export async function handleUpdateServer() {
  try {
    $cloudServerMutating.set(true)
    const serverId = $cloudInstance.get()?.id
    if (!serverId) {
      logAndReportError(new Error("No server ID found"), "handleUpdateServer")
      return
    }
    const cloudInstance = await patchCloudInstance(serverId, { action: "update" })
    $cloudInstance.set(cloudInstance)
    enqueueSnackbar(`Cloud server updated`)
  } catch (err) {
    enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
  } finally {
    $cloudServerMutating.set(false)
  }
}

export async function handleSetupServer(password: string) {
  try {
    $cloudServerMutating.set(true)

    const serverId = $cloudInstance.get()?.id
    if (!serverId) throw new Error("No server ID found")
    const user = $cloudUser.get()
    if (!user) throw new Error("No user found")

    await authenticate(user.email, password)
    await setPassword(password, $cloudAuth, $cloudRest.get())
    await unlockApp(password, $cloudAuth, $cloudRest.get())

    enqueueSnackbar(`Cloud server setup complete`)
  } catch (err) {
    enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
  } finally {
    $cloudServerMutating.set(false)
    await checkCloudUser()
  }
}

export async function handlePauseServer() {
  try {
    $cloudServerMutating.set(true)
    const serverId = $cloudInstance.get()?.id
    if (!serverId) {
      logAndReportError(new Error("No server ID found"), "handleRestartServer")
      return
    }
    const cloudInstance = await patchCloudInstance(serverId, { action: "pause" })
    $cloudInstance.set(cloudInstance)
    enqueueSnackbar(`Cloud server paused`)
  } catch (err) {
    enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
  } finally {
    $cloudServerMutating.set(false)
  }
}

export async function handleRestartServer() {
  try {
    $cloudServerMutating.set(true)
    const serverId = $cloudInstance.get()?.id
    if (!serverId) {
      logAndReportError(new Error("No server ID found"), "handleRestartServer")
      return
    }
    const cloudInstance = await patchCloudInstance(serverId, { action: "restart" })
    $cloudInstance.set(cloudInstance)
    enqueueSnackbar(`Cloud server restarted`)
  } catch (err) {
    enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
  } finally {
    $cloudServerMutating.set(false)
  }
}

export async function handleRemoveServer(removeVolume: boolean) {
  try {
    $cloudServerMutating.set(true)
    const serverId = $cloudInstance.get()?.id
    if (!serverId) {
      logAndReportError(new Error("No server ID found"), "handleRemoveServer")
      return
    }
    await removeCloudInstance(serverId, { removeVolume })
    $cloudServerInfo.set(null)
    $cloudInstance.set(null)
    enqueueSnackbar(`Cloud server destroyed`)
  } catch (err) {
    enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
  } finally {
    $cloudServerMutating.set(false)
  }
}
