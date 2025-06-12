import { atom, computed } from "nanostores"
import { logAtoms } from "src/utils/browser-utils"

export const $localAccounts = atom<string[] | undefined>()
export const $cloudAccounts = atom<string[] | undefined>()

/**
 * All child routes of `/:accountType/:accountIndex`, should assume this store as initialized,
 * because of `AccountRouteGuard` which does not let a child route render until `$accounts` is
 * defined and a valid `$activeAccount` is set.
 */
export const $activeAccount = atom<string>("")
export const $activeAccountType = atom<"local" | "cloud">("local")

export const $activeAccountPath = computed(
  [$activeAccountType, $activeAccount, $localAccounts, $cloudAccounts],
  (accountType, activeAccount, localAccounts, cloudAccounts) => {
    if (!activeAccount) return ""
    const accounts = accountType === "local" ? localAccounts : cloudAccounts
    if (!accounts) return ""
    const index = accounts.indexOf(activeAccount)
    if (index === -1) return ""
    return `/${accountType === "local" ? "l" : "c"}/${index}`
  }
)

export const $localConnectionStatus = atom<"closed" | "connected" | undefined>(undefined)
export const $localConnectionStatusText = atom<string | undefined>()

export const $cloudConnectionStatus = atom<"closed" | "connected" | undefined>(undefined)
export const $cloudConnectionStatusText = atom<string | undefined>()

export const $connectionStatus = computed(
  [$activeAccountType, $localConnectionStatus, $cloudConnectionStatus],
  (accountType, localStatus, cloudStatus) => (accountType === "cloud" ? cloudStatus : localStatus)
)

logAtoms({
  $activeAccount,
  $activeAccountPath,
  $activeAccountType,
  $cloudAccounts,
  $cloudConnectionStatus,
  $cloudConnectionStatusText,
  $localAccounts,
  $localConnectionStatus,
  $localConnectionStatusText,
})
