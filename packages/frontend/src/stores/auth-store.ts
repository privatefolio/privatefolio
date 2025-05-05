import { atom } from "nanostores"
import { logAtoms } from "src/utils/browser-utils"
import { sleep } from "src/utils/utils"
import { $rest } from "src/workers/remotes"

export const JWT_LOCAL_STORAGE_KEY = "privatefolio_jwt"

interface AuthState {
  /** Has the initial check been performed? */
  checked: boolean
  /** Error message during login/setup */
  errorMessage?: string
  /** Is the user currently authenticated with a valid JWT */
  isAuthenticated: boolean
  /** Is there a login/setup attempt in progress? */
  loading: boolean
  /** Does the backend require initial password setup? */
  needsSetup: boolean
}

export const $auth = atom<AuthState>({
  checked: false,
  errorMessage: undefined,
  isAuthenticated: false,
  loading: false,
  needsSetup: false,
})

logAtoms({ $auth })

export async function checkAuthentication() {
  const baseUrl = $rest.get()

  try {
    const statusRes = await fetch(`${baseUrl}/api/setup-status`)
    if (!statusRes.ok) {
      $auth.set({ ...$auth.get(), errorMessage: "Failed to check setup status." })
    } else {
      const { needsSetup } = (await statusRes.json()) as { needsSetup: boolean }
      if (needsSetup) {
        $auth.set({ ...$auth.get(), checked: true, loading: false, needsSetup })
        return
      }
    }

    const jwt = localStorage.getItem(JWT_LOCAL_STORAGE_KEY)
    if (!jwt) {
      $auth.set({ ...$auth.get(), checked: true })
      return
    }

    const verifyRes = await fetch(`${baseUrl}/api/verify-auth`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })

    const data = await verifyRes.json()
    if (data.valid) {
      $auth.set({ ...$auth.get(), checked: true, isAuthenticated: true })
    } else {
      $auth.set({ ...$auth.get(), checked: true, errorMessage: data.error, isAuthenticated: false })
    }
  } catch (error) {
    console.error("⚠️ Authentication check failed:", error)
    $auth.set({
      ...$auth.get(),
      checked: true,
      errorMessage: `Cannot connect to server at ${baseUrl}.`,
      isAuthenticated: false,
      loading: false,
    })
  }
}

export function lockApp() {
  try {
    localStorage.removeItem(JWT_LOCAL_STORAGE_KEY)
  } catch (error) {
    console.error("Failed to remove JWT from localStorage:", error)
  }
  // Reset auth state, keeping setup status known
  const currentState = $auth.get()
  $auth.set({
    ...currentState,
    errorMessage: undefined,
    isAuthenticated: false,
    loading: false,
  })
}

/**
 * Performs the initial password setup.
 * @param password The password to set.
 */
export async function setPassword(password: string) {
  const baseUrl = $rest.get()
  $auth.set({ ...$auth.get(), loading: true })

  try {
    const response = await fetch(`${baseUrl}/api/setup`, {
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    if (response.status === 201) {
      $auth.set({
        ...$auth.get(),
        errorMessage: undefined,
        loading: false,
        needsSetup: false,
      })
    } else {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to parse error response" }))
      const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`
      $auth.set({ ...$auth.get(), errorMessage, loading: false })
    }
  } catch (error) {
    console.error("⚠️ Authentication setup failed:", error)

    $auth.set({
      ...$auth.get(),
      errorMessage: `Cannot connect to server at ${baseUrl}.`,
      loading: false,
    })
  }
}

/**
 * Logs in the user by exchanging the password for a JWT.
 * @param password The user's password.
 */
export async function unlockApp(password: string) {
  const baseUrl = $rest.get()

  $auth.set({ ...$auth.get(), loading: true })
  try {
    const response = await fetch(`${baseUrl}/api/login`, {
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    if (response.ok) {
      const data = (await response.json()) as { token: string }
      if (!data.token) throw new Error("No token received from login endpoint.")

      localStorage.setItem(JWT_LOCAL_STORAGE_KEY, data.token)
      $auth.set({
        ...$auth.get(),
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
    $auth.set({
      ...$auth.get(),
      errorMessage: error instanceof Error ? error.message : String(error),
      loading: false,
    })
  }
}
