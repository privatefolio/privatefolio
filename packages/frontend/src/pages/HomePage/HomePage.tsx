import { Stack } from "@mui/material"
import React from "react"
import { useSearchParams } from "react-router-dom"
import { NavTab } from "src/components/NavTab"
import { Tabs } from "src/components/Tabs"

import { BreakdownChart } from "../NetworthPage/BreakdownChart"
import { NetworthActions } from "../NetworthPage/NetworthActions"
import NetworthPage from "../NetworthPage/NetworthPage"
import { PnLPage } from "../PnLPage/PnLPage"

const defaultTab = "networth"

export default function HomePage() {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || defaultTab

  return (
    <main>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Tabs value={tab} defaultValue={defaultTab} largeSize>
          <NavTab value="networth" to="?tab=networth" label="Net worth" />
          <NavTab value="breakdown" to="?tab=breakdown" label="Breakdown" />
          <NavTab value="pnl" to="?tab=pnl" label="Profit & loss" />
        </Tabs>
        {tab === "networth" && <NetworthActions />}
      </Stack>
      {tab === "networth" && <NetworthPage />}
      {tab === "pnl" && <PnLPage />}
      {tab === "breakdown" && <BreakdownChart />}
    </main>
  )
}
