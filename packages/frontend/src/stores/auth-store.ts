import { atom, computed, WritableAtom } from "nanostores"
import { logAtoms } from "src/utils/browser-utils"
import { sleep } from "src/utils/utils"
import { RestConfig } from "src/workers/remotes"

import { $activeAccountType } from "./account-store"

export interface AuthState {
  checked: boolean
  errorMessage?: string
  isAuthenticated: boolean
  kioskMode: boolean
  loading: boolean
  needsSetup: boolean
}

export const $localAuth = atom<AuthState>({
  checked: false,
  errorMessage: undefined,
  isAuthenticated: false,
  kioskMode: false,
  loading: false,
  needsSetup: false,
})

export const $cloudAuth = atom<AuthState>({
  checked: false,
  errorMessage: undefined,
  isAuthenticated: false,
  kioskMode: false,
  loading: false,
  needsSetup: false,
})

export const $auth = computed(
  [$activeAccountType, $localAuth, $cloudAuth],
  (accountType, localAuth, cloudAuth) => {
    return accountType === "cloud" ? cloudAuth : localAuth
  }
)

logAtoms({ $auth, $cloudAuth, $localAuth })

export async function checkAuthentication(atom: WritableAtom<AuthState>, api: RestConfig | null) {
  if (!api) return
  const { baseUrl, jwtKey } = api

  try {
    const statusRes = await fetch(`${baseUrl}/api/setup-status`)
    if (!statusRes.ok) {
      atom.set({ ...atom.get(), errorMessage: "Failed to check setup status." })
    } else {
      const { needsSetup, kioskMode } = (await statusRes.json()) as {
        kioskMode: boolean
        needsSetup: boolean
      }
      if (needsSetup) {
        atom.set({ ...atom.get(), checked: true, kioskMode, loading: false, needsSetup })
        return
      }
      if (kioskMode) {
        atom.set({
          ...atom.get(),
          checked: true,
          isAuthenticated: true,
          kioskMode,
          loading: false,
          needsSetup: false,
        })
        return
      }
    }

    const jwt = localStorage.getItem(jwtKey)
    if (!jwt) {
      atom.set({ ...atom.get(), checked: true })
      return
    }

    const verifyRes = await fetch(`${baseUrl}/api/verify-auth`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })

    const data = await verifyRes.json()
    if (data.valid) {
      atom.set({ ...atom.get(), checked: true, isAuthenticated: true, kioskMode: data.kioskMode })
    } else {
      atom.set({
        ...atom.get(),
        checked: true,
        errorMessage: data.error,
        isAuthenticated: false,
      })
    }
  } catch (error) {
    console.error("⚠️ Authentication check failed:", error)
    atom.set({
      ...atom.get(),
      checked: true,
      errorMessage: `Cannot connect to server at ${baseUrl}.`,
      isAuthenticated: false,
      loading: false,
    })
  }
}

export function lockApp(atom: WritableAtom<AuthState>, api: RestConfig | null) {
  if (!api) return
  const { jwtKey } = api

  try {
    localStorage.removeItem(jwtKey)
  } catch (error) {
    console.error("Failed to remove JWT from localStorage:", error)
  }
  // Reset auth state, keeping setup status known
  atom.set({
    ...atom.get(),
    errorMessage: undefined,
    isAuthenticated: false,
    loading: false,
  })
}

/**
 * Performs the initial password setup.
 * @param password The password to set.
 */
export async function setPassword(
  password: string,
  atom: WritableAtom<AuthState>,
  api: RestConfig | null
) {
  if (!api) return
  const { baseUrl } = api
  atom.set({ ...atom.get(), loading: true })

  try {
    const response = await fetch(`${baseUrl}/api/setup`, {
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    if (response.status === 201) {
      atom.set({
        ...atom.get(),
        errorMessage: undefined,
        loading: false,
        needsSetup: false,
      })
    } else {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to parse error response" }))
      const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`
      atom.set({ ...atom.get(), errorMessage, loading: false })
    }
  } catch (error) {
    console.error("⚠️ Authentication setup failed:", error)

    atom.set({
      ...atom.get(),
      errorMessage: `Cannot connect to server at ${baseUrl}.`,
      loading: false,
    })
  }
}

/**
 * Logs in the user by exchanging the password for a JWT.
 * @param password The user's password.
 */
export async function unlockApp(
  password: string,
  atom: WritableAtom<AuthState>,
  api: RestConfig | null
) {
  if (!api) return
  const { baseUrl, jwtKey } = api

  atom.set({ ...atom.get(), loading: true })
  try {
    const response = await fetch(`${baseUrl}/api/login`, {
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    if (response.ok) {
      const data = (await response.json()) as { token: string }
      if (!data.token) throw new Error("No token received from login endpoint.")

      localStorage.setItem(jwtKey, data.token)
      atom.set({
        ...atom.get(),
        errorMessage: undefined,
        isAuthenticated: true,
        loading: false,
      })
    } else {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to parse error response" }))
      const errorMessage = errorData?.error || `Login failed: ${response.status}`
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error("Login request failed:", error)

    await sleep(1_000)
    atom.set({
      ...atom.get(),
      errorMessage: error instanceof Error ? error.message : String(error),
      loading: false,
    })

    throw error
  }
}
