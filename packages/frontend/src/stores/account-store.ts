import { atom, computed } from "nanostores"
import { logAtoms } from "src/utils/browser-utils"

export const $localAccounts = atom<string[] | undefined>()
export const $cloudAccounts = atom<string[] | undefined>()
export const $isCloudAccount = atom<boolean>(false)

/**
 * All child routes of `/u/:accountIndex`, should assume this store as initialized,
 * because of `AccountIndexRoute` which does not let a child route render until `$accounts` is
 * defined and a valid `$activeAccount` is set.
 */
export const $activeAccount = atom<string>("")

// TODO9 remove this, it should be accountId instead
export const $activeIndex = computed(
  [$activeAccount, $localAccounts, $cloudAccounts],
  (activeAccount, accounts, cloudAccounts) => {
    if (!accounts || !activeAccount) return

    const allAccounts = accounts.concat(cloudAccounts || [])
    const index = allAccounts.indexOf(activeAccount)
    $isCloudAccount.set(index >= accounts.length)

    return index === -1 ? undefined : index
  }
)

export const $accounts = computed(
  [$localAccounts, $cloudAccounts],
  (localAccounts, cloudAccounts) => {
    return localAccounts?.concat(cloudAccounts || [])
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
