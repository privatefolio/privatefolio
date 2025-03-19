import { useStore } from "@nanostores/react"
import React, { memo, useEffect } from "react"
import { Navigate, Outlet, useParams } from "react-router-dom"

import { $accounts, $activeAccount } from "./stores/account-store"

function BaseAccountIndexRoute() {
  const params = useParams()
  const accounts = useStore($accounts)
  const activeAccountState = useStore($activeAccount)

  const loadingAccounts = !accounts

  const activeIndex = params.accountIndex ? parseInt(params.accountIndex, 10) : NaN
  const activeAccount = accounts?.[activeIndex]

  const isInvalid = loadingAccounts || isNaN(activeIndex) || activeIndex >= accounts.length
  const isReady = activeAccount === activeAccountState

  useEffect(() => {
    if (isInvalid || isReady) return

    $activeAccount.set(accounts[activeIndex])
  }, [accounts, isInvalid, activeIndex, isReady])

  if (loadingAccounts) return null
  if (isInvalid) return <Navigate to="/" />
  if (!isReady) return null
  return <Outlet />
}

export const AccountIndexRoute = memo(BaseAccountIndexRoute)
