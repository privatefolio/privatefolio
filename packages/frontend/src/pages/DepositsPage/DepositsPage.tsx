import { Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect } from "react"
import { Subheading } from "src/components/Subheading"
import { WorkInProgressCallout } from "src/components/WorkInProgressCallout"
import { $activeAccount } from "src/stores/account-store"
import { $inspectTime } from "src/stores/pages/balances-store"
import { formatDate } from "src/utils/formatting-utils"

import { TradeActions } from "../TradesPage/TradeActions"
import { TransactionTable } from "../TransactionsPage/TransactionTable"
import { DepositsChart } from "./DepositsChart"

export function DepositsPage() {
  const activeAccount = useStore($activeAccount)
  const inspectTime = useStore($inspectTime)

  useEffect(() => {
    document.title = `Deposits & withdrawals - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  return (
    <Stack gap={4}>
      <DepositsChart />
      <Stack gap={1}>
        <div>
          <Subheading>
            <span>
              Transactions{" "}
              {inspectTime !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  on {formatDate(inspectTime)}
                </Typography>
              )}
            </span>
            <TradeActions />
          </Subheading>
          <TransactionTable defaultRowsPerPage={10} />
        </div>
        <WorkInProgressCallout />
      </Stack>
    </Stack>
  )
}
