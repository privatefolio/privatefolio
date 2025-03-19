import { computed } from "nanostores"
import type { Api } from "privatefolio-backend/build/src/api/api"
import { createBackendRelayer } from "privatefolio-backend/build/src/backend-relayer"
import { $connectionStatus, $isCloudAccount } from "src/stores/account-store"
import { $user, User } from "src/stores/cloud-account-store"
import { isProduction } from "src/utils/environment-utils"

// WEBWORKER remote
// import "./comlink-setup"

// import { Remote, wrap } from "comlink"

// import type { Clancy as BaseType } from "./clancy"

// const clancyWorker = new Worker(new URL("./clancy.ts", import.meta.url), {
//   name: "Clancy",
//   type: "module",
// })

// type Clancy = Omit<Remote<BaseType>, "getValue"> & {
//   getValue<T>(key: string, defaultValue: T | null, accountName?: string): Promise<T | null>
// }

// export const clancy = wrap(clancyWorker) as Clancy

const LOCAL_SERVER_URL = isProduction ? "localhost:5001" : "localhost:4001"
const REMOTE_SERVER_URL = (user: User) => `cloud.privatefolio.app:${50000 + user.id}`

export const LOCAL_RPC = createBackendRelayer<Api>(`ws://${LOCAL_SERVER_URL}`, (status) => {
  $connectionStatus.set(status)
})

export const $rpc = computed([$isCloudAccount, $user], (isCloudAccount, user) => {
  // if (!activeAccount) return

  if (isCloudAccount) {
    return createBackendRelayer<Api>(`ws://${REMOTE_SERVER_URL(user as User)}`, (status) => {
      $connectionStatus.set(status)
    })
  } else {
    return LOCAL_RPC
  }
})

$rpc.subscribe((rpc) => {
  (window as any).rpc = rpc
})

export const $rest = computed([$isCloudAccount, $user], (isCloudAccount, user) => {
  // if (!activeAccount) return

  const address = isCloudAccount
    ? `http://${REMOTE_SERVER_URL(user as User)}`
    : `http://${LOCAL_SERVER_URL}`

  return address
})
