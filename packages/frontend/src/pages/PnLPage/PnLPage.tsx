import { Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect } from "react"
import { WorkInProgressCallout } from "src/components/WorkInProgressCallout"
import { $activeAccount } from "src/stores/account-store"

import { PnLChart } from "./PnLChart"

export function PnLPage() {
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Profit & loss - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  return (
    <Stack gap={1}>
      <PnLChart />
      <WorkInProgressCallout />
    </Stack>
  )
}
