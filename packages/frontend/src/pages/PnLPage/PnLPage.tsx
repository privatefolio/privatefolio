import { Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect } from "react"
import { Subheading } from "src/components/Subheading"
import { WorkInProgressCallout } from "src/components/WorkInProgressCallout"
import { $activeAccount } from "src/stores/account-store"
import { $inspectTime } from "src/stores/pages/balances-store"
import { formatDate } from "src/utils/formatting-utils"

import { TradeActions } from "../TradesPage/TradeActions"
import { TradeTable } from "../TradesPage/TradeTable"
import { PnLChart } from "./PnLChart"

export function PnLPage() {
  const activeAccount = useStore($activeAccount)
  const inspectTime = useStore($inspectTime)

  useEffect(() => {
    document.title = `Profits - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  return (
    <Stack gap={4}>
      <PnLChart />
      <Stack gap={1}>
        <div>
          <Subheading>
            <span>
              Trades{" "}
              {inspectTime !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  on {formatDate(inspectTime)}
                </Typography>
              )}
            </span>
            <TradeActions />
          </Subheading>
          <TradeTable defaultRowsPerPage={10} tradeStatus="open" />
        </div>
        <WorkInProgressCallout />
      </Stack>
    </Stack>
  )
}
