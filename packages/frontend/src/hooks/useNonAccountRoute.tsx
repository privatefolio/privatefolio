import { useStore } from "@nanostores/react"
import { useEffect } from "react"
import { $activeAccount } from "src/stores/account-store"

export function useNonAccountRoute() {
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    if (activeAccount) {
      $activeAccount.set("")
    }
  }, [activeAccount])
}
