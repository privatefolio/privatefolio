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
import { $cloudRest } from "src/workers/remotes"

import { $cloudAuth, setPassword, unlockApp } from "./auth-store"

export const $cloudUser = atom<User | null | undefined>()
export const $cloudSubscription = atom<Subscription | null | undefined>()
export const $cloudPortalLink = atom<string | null | undefined>()
export const $cloudServerInfo = atom<CloudInstance | null | undefined>()
export const $cloudServerMutating = atom<boolean>(false)

logAtoms({ $cloudServerInfo, $cloudSubscription, $cloudUser })

export async function checkCloudLogin() {
  // console.log("PrivateCloud -", "checking auth")
  try {
    const user = await reAuthenticate()
    $cloudUser.set(user)
    await Promise.all([checkSubscription(), checkCloudInstance()])
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
    .catch((err: Error) => {
      console.error("Error fetching cloud subscription:", err)
      $cloudSubscription.set(null)
      enqueueSnackbar(`Cloud server: ${err.message}`, { variant: "error" })
    })
}

export async function checkCloudInstance() {
  // console.log("PrivateCloud -", "checking cloud instance")
  return getCloudInstance()
    .then($cloudServerInfo.set)
    .catch((err: Error) => {
      console.error("Error fetching cloud server info:", err)
      $cloudServerInfo.set(null)
      enqueueSnackbar(`Cloud server: ${err.message}`, { variant: "error" })
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
    const serverInfo = await createCloudInstance()
    $cloudServerInfo.set(serverInfo)
    enqueueSnackbar(`Cloud server initialized`)
  } catch (err) {
    enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
  } finally {
    $cloudServerMutating.set(false)
  }
}
export async function handleUnpauseServer() {
  try {
    $cloudServerMutating.set(true)
    const serverId = $cloudServerInfo.get()?.id
    if (!serverId) {
      console.error("No server ID found")
      return
    }
    const serverInfo = await patchCloudInstance(serverId, { action: "unpause" })
    $cloudServerInfo.set(serverInfo)
    enqueueSnackbar(`Cloud server unpaused`)
  } catch (err) {
    enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
  } finally {
    $cloudServerMutating.set(false)
  }
}

export async function handleSetupServer(password: string) {
  try {
    $cloudServerMutating.set(true)

    const serverId = $cloudServerInfo.get()?.id
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
    const serverId = $cloudServerInfo.get()?.id
    if (!serverId) {
      console.error("No server ID found")
      return
    }
    const serverInfo = await patchCloudInstance(serverId, { action: "pause" })
    $cloudServerInfo.set(serverInfo)
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
    const serverId = $cloudServerInfo.get()?.id
    if (!serverId) {
      console.error("No server ID found")
      return
    }
    const serverInfo = await patchCloudInstance(serverId, { action: "restart" })
    $cloudServerInfo.set(serverInfo)
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
    const serverId = $cloudServerInfo.get()?.id
    if (!serverId) {
      console.error("No server ID found")
      return
    }
    await removeCloudInstance(serverId, { removeVolume })
    $cloudServerInfo.set(null)
    enqueueSnackbar(`Cloud server destroyed`)
  } catch (err) {
    enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
  } finally {
    $cloudServerMutating.set(false)
  }
}
