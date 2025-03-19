import { Stack } from "@mui/material"
import React, { useEffect } from "react"
import { WorkInProgressCallout } from "src/components/WorkInProgressCallout"
import { $activeAccount } from "src/stores/account-store"

import { PnLChart } from "./PnLChart"

export function PnLPage() {
  useEffect(() => {
    document.title = `Profit & loss - ${$activeAccount.get()} - Privatefolio`
  }, [])

  return (
    <Stack gap={1}>
      <PnLChart />
      <WorkInProgressCallout />
    </Stack>
  )
}
