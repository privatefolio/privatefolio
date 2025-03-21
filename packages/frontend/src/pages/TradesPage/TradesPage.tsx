import { CalculateOutlined } from "@mui/icons-material"
import { Button, Stack } from "@mui/material"
import React, { useCallback, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { NavTab } from "src/components/NavTab"
import { StaggeredList } from "src/components/StaggeredList"
import { Tabs } from "src/components/Tabs"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

import { TradeTable } from "./TradeTable"

const defaultTab = "active"

export default function TradesPage({ show }: { show: boolean }) {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || defaultTab

  useEffect(() => {
    document.title = `Trades - ${$activeAccount.get()} - Privatefolio`
  }, [])

  const handleComputeTrades = useCallback(() => {
    $rpc.get().enqueueComputeTrades($activeAccount.get())
  }, [])

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <Stack>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Tabs value={tab} defaultValue={defaultTab} largeSize>
            <NavTab value="active" to="?tab=active" label="Trades" />
            <NavTab value="closed" to="?tab=closed" label="History" />
          </Tabs>
          <Button
            startIcon={<CalculateOutlined />}
            variant="outlined"
            size="medium"
            color="secondary"
            onClick={handleComputeTrades}
          >
            Compute Trades
          </Button>
        </Stack>
        <TradeTable tableType={tab as "active" | "closed"} />
      </Stack>
    </StaggeredList>
  )
}
