import { atom, computed } from "nanostores"
import { logAtoms } from "src/utils/browser-utils"

export const $localAccounts = atom<string[] | undefined>()
export const $cloudAccounts = atom<string[] | undefined>()

/**
 * All child routes of `/u/:accountIndex`, should assume this store as initialized,
 * because of `AccountIndexRoute` which does not let a child route render until `$accounts` is
 * defined and a valid `$activeAccount` is set.
 */
export const $activeAccount = atom<string>("")

export const $accounts = computed(
  [$localAccounts, $cloudAccounts],
  (localAccounts, cloudAccounts) => {
    if (!localAccounts && !cloudAccounts) return undefined
    return (localAccounts || []).concat(cloudAccounts || [])
  }
)

// TODO9 remove this, it should be accountId instead
export const $activeIndex = computed([$activeAccount, $accounts], (activeAccount, accounts) => {
  if (!accounts || !activeAccount) return

  const index = accounts.indexOf(activeAccount)

  return index === -1 ? undefined : index
})

export const $isCloudAccount = computed(
  [$activeIndex, $accounts, $localAccounts, $cloudAccounts],
  (activeIndex, accounts, localAccounts, cloudAccounts) => {
    if (!accounts || activeIndex === undefined) return false
    if (!localAccounts) return true
    if (!cloudAccounts) return false

    return activeIndex >= (localAccounts?.length || 0)
  }
)

export const demoAccountName = "demo" // TODO8 move to server

export const $localConnectionStatus = atom<"closed" | "connected" | undefined>(undefined)
export const $localConnectionStatusText = atom<string | undefined>()

export const $cloudConnectionStatus = atom<"closed" | "connected" | undefined>(undefined)
export const $cloudConnectionStatusText = atom<string | undefined>()

export const $connectionStatus = computed(
  [$isCloudAccount, $localConnectionStatus, $cloudConnectionStatus],
  (isCloudAccount, localStatus, cloudStatus) => (isCloudAccount ? cloudStatus : localStatus)
)

logAtoms({
  $activeAccount,
  $cloudAccounts,
  $cloudConnectionStatus,
  $cloudConnectionStatusText,
  $isCloudAccount,
  $localAccounts,
  $localConnectionStatus,
  $localConnectionStatusText,
})
