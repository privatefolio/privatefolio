import { Stack } from "@mui/material"
import React from "react"
import { useSearchParams } from "react-router-dom"
import { NavTab } from "src/components/NavTab"
import { StaggeredList } from "src/components/StaggeredList"
import { Tabs } from "src/components/Tabs"

import { BlockchainsTable } from "./BlockchainsTable"
import { ExchangesTable } from "./ExchangesTable"
import { PlatformActions } from "./PlatformActions"

export default function PlatformsPage({ show }: { show: boolean }) {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "exchanges"

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <Stack>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Tabs value={tab} defaultValue={tab} largeSize>
            <NavTab value="exchanges" to={"?tab=exchanges"} label="Exchanges" />
            <NavTab value="blockchains" to={"?tab=blockchains"} label="Blockchains" />
          </Tabs>
          <PlatformActions />
        </Stack>
        {tab === "exchanges" && <ExchangesTable />}
        {tab === "blockchains" && <BlockchainsTable />}
      </Stack>
    </StaggeredList>
  )
}
