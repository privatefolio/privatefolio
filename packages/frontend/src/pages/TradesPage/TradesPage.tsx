import { Button } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useCallback } from "react"
import { StaggeredList } from "src/components/StaggeredList"
import { Subheading } from "src/components/Subheading"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

import { TradeTable } from "./TradeTable"

export default function TradesPage({ show }: { show: boolean }) {
  const accountName = useStore($activeAccount)

  const handleComputeTrades = useCallback(() => {
    $rpc.get().enqueueComputeTrades(accountName)
  }, [accountName])

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <div>
        <Subheading>
          <span>Trades</span>
          <Button variant="outlined" size="small" onClick={handleComputeTrades}>
            Compute Trades
          </Button>
        </Subheading>
        <TradeTable />
      </div>
    </StaggeredList>
  )
}
