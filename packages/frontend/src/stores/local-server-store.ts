import { atom, computed } from "nanostores"
import { logAtoms } from "src/utils/browser-utils"
import { localServerEnabled } from "src/utils/environment-utils"
import { setIfChanged } from "src/utils/store-utils"
import { $localRest } from "src/workers/remotes"

import { $localConnectionStatus } from "./account-store"
import { $localAuth, checkAuthentication, DEFAULT_AUTH_STATE } from "./auth-store"
import { ServerInfo } from "./cloud-server-store"

export const $localServerInfo = atom<ServerInfo | null | undefined>()
export const $localAvailable = computed([$localServerInfo], (info) => {
  return !!info
})

logAtoms({ $localAvailable, $localServerInfo })

$localConnectionStatus.listen((status) => {
  if (status === "closed") {
    checkLocalServerInfo()
    checkAuthentication($localAuth, $localRest.get())
  }
})

export async function checkLocalServerInfo() {
  if (!localServerEnabled) return
  const rest = $localRest.get()

  if (!rest) return
  const { baseUrl } = rest
  return fetch(`${baseUrl}/info`)
    .then((res) => res.json())
    .then((info) => {
      setIfChanged($localServerInfo, info)
    })
    .catch((error: Error) => {
      console.warn("Error fetching local server info:", error)
      if ($localServerInfo.get() !== null) {
        setIfChanged($localServerInfo, null)
        setIfChanged($localAuth, DEFAULT_AUTH_STATE)
      }
      // enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
    })
}
