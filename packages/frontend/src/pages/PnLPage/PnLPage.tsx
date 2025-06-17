import { Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect } from "react"
import { Subheading } from "src/components/Subheading"
import { WorkInProgressCallout } from "src/components/WorkInProgressCallout"
import { $activeAccount } from "src/stores/account-store"

import { TradeActions } from "../TradesPage/TradeActions"
import { TradeTable } from "../TradesPage/TradeTable"
import { PnLChart } from "./PnLChart"

export function PnLPage() {
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Profit & loss - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  return (
    <Stack gap={4}>
      <PnLChart />
      <Stack gap={1}>
        <div>
          <Subheading>
            <span>Trades</span>
            <TradeActions />
          </Subheading>
          <TradeTable defaultRowsPerPage={10} tradeStatus="open" />
        </div>
        <WorkInProgressCallout />
      </Stack>
    </Stack>
  )
}
