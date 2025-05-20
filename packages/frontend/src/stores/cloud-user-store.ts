import { isEqual } from "lodash-es"
import { atom } from "nanostores"
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
import { isSelfHosted } from "src/utils/environment-utils"
import { $cloudRest } from "src/workers/remotes"

import { $cloudAuth, setPassword, unlockApp } from "./auth-store"

export type CloudServerInfo = {
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
export const $cloudServerInfo = atom<CloudServerInfo | null | undefined>()
export const $cloudServerMutating = atom<boolean>(false)

logAtoms({ $cloudInstance, $cloudServerInfo, $cloudSubscription, $cloudUser })

export async function checkCloudLogin() {
  if (isSelfHosted) return
  // console.log("PrivateCloud -", "checking auth")
  try {
    const user = await reAuthenticate()
    $cloudUser.set(user)
    await Promise.all([checkSubscription(), checkCloudInstance()])
    await checkCloudServerInfo()
  } catch (e) {
    console.error("Auth error:", e)
    $cloudUser.set(null)
  }
}

export async function checkSubscription() {
  // console.log("PrivateCloud -", "checking service subscription")
  return getSubscription()
    .then((sub) => {
      if (isEqual(sub, $cloudSubscription.get())) return
      $cloudSubscription.set(sub)
    })
    .catch((err) => {
      console.error("Error fetching cloud subscription:", err)
      $cloudSubscription.set(null)
      enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
    })
}

export async function checkCloudInstance() {
  // console.log("PrivateCloud -", "checking cloud instance")
  return getCloudInstance()
    .then($cloudInstance.set)
    .catch((err) => {
      console.error("Error fetching cloud server info:", err)
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
      if (isEqual(info, $cloudServerInfo.get())) return
      $cloudServerInfo.set(info)
    })
    .catch((err: Error) => {
      console.error("Error fetching cloud server info:", err)
      if ($cloudServerInfo.get() === undefined) $cloudServerInfo.set(null)
      // enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
    })
}

export async function handleLogin(email: string, password: string) {
  const user = await authenticate(email, password)
  $cloudUser.set(user)
}

export async function handleLogout() {
  await logout()
  $cloudUser.set(null)
}

export async function handleSignUp(email: string, password: string) {
  await createUser(email, password)
  await handleLogin(email, password)
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
      console.error("No server ID found")
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
      console.error("No server ID found")
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
    await checkCloudLogin()
  }
}

export async function handlePauseServer() {
  try {
    $cloudServerMutating.set(true)
    const serverId = $cloudInstance.get()?.id
    if (!serverId) {
      console.error("No server ID found")
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
      console.error("No server ID found")
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
      console.error("No server ID found")
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
