import { isEqual } from "lodash-es"
import { atom, computed } from "nanostores"
import { localServerEnabled } from "src/utils/environment-utils"
import { $localRest } from "src/workers/remotes"

import { ServerInfo } from "./cloud-server-store"

export const $localServerInfo = atom<ServerInfo | null | undefined>()
export const $localAvailable = computed([$localServerInfo], (info) => {
  return !!info
})

export async function checkLocalServerInfo() {
  if (!localServerEnabled) return
  const rest = $localRest.get()

  if (!rest) return
  const { baseUrl } = rest
  return fetch(`${baseUrl}/info`)
    .then((res) => res.json())
    .then((info) => {
      if (isEqual(info, $localServerInfo.get())) return
      $localServerInfo.set(info)
    })
    .catch((err: Error) => {
      console.warn("Error fetching local server info:", err)
      if ($localServerInfo.get() === undefined) $localServerInfo.set(null)
      // enqueueSnackbar(`Cloud server: ${(err as Error).message}`, { variant: "error" })
    })
}
