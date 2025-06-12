import { useStore } from "@nanostores/react"
import React, { memo, useEffect } from "react"
import { Navigate, Outlet, useParams } from "react-router-dom"

import {
  $activeAccount,
  $activeAccountType,
  $cloudAccounts,
  $localAccounts,
} from "./stores/account-store"

function BaseAccountRouteGuard() {
  const params = useParams()
  const localAccounts = useStore($localAccounts)
  const cloudAccounts = useStore($cloudAccounts)
  const activeAccountState = useStore($activeAccount)
  const activeAccountTypeState = useStore($activeAccountType)

  const accountTypeInitial = params.accountType as "l" | "c"
  const accounts = accountTypeInitial === "l" ? localAccounts : cloudAccounts
  const loading = !accounts

  const activeIndex = params.accountIndex ? parseInt(params.accountIndex, 10) : NaN
  const activeAccount = accounts?.[activeIndex]

  const isInvalid = loading || isNaN(activeIndex) || activeIndex >= accounts.length
  const matchingAccount = activeAccount === activeAccountState
  const matchingType =
    (accountTypeInitial === "l" && activeAccountTypeState === "local") ||
    (accountTypeInitial === "c" && activeAccountTypeState === "cloud")
  const isReady = matchingAccount && matchingType

  useEffect(() => {
    if (isInvalid || isReady) return

    $activeAccount.set(accounts[activeIndex])
    $activeAccountType.set(accountTypeInitial === "l" ? "local" : "cloud")
  }, [accounts, isInvalid, activeIndex, isReady, accountTypeInitial])

  if (loading) return null
  if (isInvalid) return <Navigate to="/" />
  if (!isReady) return null
  return <Outlet />
}

export const AccountRouteGuard = memo(BaseAccountRouteGuard)
