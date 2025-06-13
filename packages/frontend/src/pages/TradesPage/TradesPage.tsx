import { Stack } from "@mui/material"
import React, { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { NavTab } from "src/components/NavTab"
import { StaggeredList } from "src/components/StaggeredList"
import { Tabs } from "src/components/Tabs"
import { $activeAccount } from "src/stores/account-store"

import { TradeActions } from "./TradeActions"
import { TradeTable } from "./TradeTable"

export default function TradesPage({ show }: { show: boolean }) {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "open"

  useEffect(() => {
    document.title = `Trades - ${$activeAccount.get()} - Privatefolio`
  }, [])

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <Stack>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Tabs value={tab} defaultValue={tab} largeSize>
            <NavTab value="open" to="?tab=open" label="Trades" />
            <NavTab value="closed" to="?tab=closed" label="History" />
          </Tabs>
          <TradeActions />
        </Stack>
        <TradeTable tableType={tab as "open" | "closed"} />
      </Stack>
    </StaggeredList>
  )
}
