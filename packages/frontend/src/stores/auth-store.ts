import { atom, computed, WritableAtom } from "nanostores"
import { logAtoms } from "src/utils/browser-utils"
import { logAndReportError } from "src/utils/error-utils"
import { patchIfChanged, setIfChanged } from "src/utils/store-utils"
import { sleep } from "src/utils/utils"
import { RestConfig } from "src/workers/remotes"

import { $activeAccountType } from "./account-store"

export interface AuthState {
  checked: boolean
  errorMessage?: string
  isAuthenticated: boolean
  kioskMode: boolean
  mutating: boolean
  needsSetup: boolean
}

export const DEFAULT_AUTH_STATE: AuthState = {
  checked: false,
  errorMessage: undefined,
  isAuthenticated: false,
  kioskMode: false,
  mutating: false,
  needsSetup: false,
}

export const $localAuth = atom<AuthState>(DEFAULT_AUTH_STATE)
export const $cloudAuth = atom<AuthState>(DEFAULT_AUTH_STATE)

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
    /**
     * Check if the server is set up
     */
    const statusRes = await fetch(`${baseUrl}/api/setup-status`)
    if (!statusRes.ok) {
      setIfChanged(atom, {
        ...DEFAULT_AUTH_STATE,
        checked: true,
        errorMessage: "Failed to check setup status.",
      })
      return
    }

    const { needsSetup, kioskMode } = (await statusRes.json()) as {
      kioskMode: boolean
      needsSetup: boolean
    }

    if (needsSetup) {
      setIfChanged(atom, { ...DEFAULT_AUTH_STATE, checked: true, kioskMode, needsSetup })
      return
    }

    const jwt = localStorage.getItem(jwtKey)

    if (kioskMode && !jwt) {
      setIfChanged(atom, {
        ...DEFAULT_AUTH_STATE,
        checked: true,
        isAuthenticated: true,
        kioskMode,
      })
      return
    }

    if (!jwt) {
      setIfChanged(atom, { ...DEFAULT_AUTH_STATE, checked: true })
      return
    }

    const verifyRes = await fetch(`${baseUrl}/api/verify-auth`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })

    const { valid, error } = (await verifyRes.json()) as {
      error?: string
      valid: boolean
    }

    if (!valid) {
      let errorMessage = error!
      if (errorMessage.includes("expired")) {
        errorMessage = "Session expired. Please login again."
      }
      setIfChanged(atom, {
        ...DEFAULT_AUTH_STATE,
        checked: true,
        errorMessage,
      })
      return
    }

    setIfChanged(atom, {
      ...DEFAULT_AUTH_STATE,
      checked: true,
      isAuthenticated: true,
    })
  } catch (error) {
    logAndReportError(error, "Authentication check failed")
    setIfChanged(atom, {
      ...DEFAULT_AUTH_STATE,
      checked: true,
      errorMessage: `Cannot connect to server at ${baseUrl}.`,
    })
  }
}

export function lockApp(atom: WritableAtom<AuthState>, api: RestConfig | null) {
  if (!api) return
  const { jwtKey } = api
  localStorage.removeItem(jwtKey)
  setIfChanged(atom, { ...DEFAULT_AUTH_STATE, checked: true, isAuthenticated: false })
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
  patchIfChanged(atom, { mutating: true })

  try {
    const response = await fetch(`${baseUrl}/api/setup`, {
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    if (response.status === 201) {
      patchIfChanged(atom, { errorMessage: undefined, mutating: false, needsSetup: false })
    } else {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to parse error response" }))
      const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`
      patchIfChanged(atom, { errorMessage, mutating: false })
    }
  } catch (error) {
    logAndReportError(error, "Authentication setup failed")
    patchIfChanged(atom, {
      errorMessage: `Cannot connect to server at ${baseUrl}.`,
      mutating: false,
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

  patchIfChanged(atom, { mutating: true })
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
      patchIfChanged(atom, { errorMessage: undefined, isAuthenticated: true, mutating: false })
    } else {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to parse error response" }))
      const errorMessage = errorData?.error || `Login failed: ${response.status}`
      throw new Error(errorMessage)
    }
  } catch (error) {
    logAndReportError(error, "Login request failed")

    await sleep(1_000)
    patchIfChanged(atom, {
      errorMessage: error instanceof Error ? error.message : String(error),
      mutating: false,
    })

    throw error
  }
}
