import { Stack } from "@mui/material"
import React from "react"
import { useSearchParams } from "react-router-dom"
import { NavTab } from "src/components/NavTab"
import { StaggeredList } from "src/components/StaggeredList"
import { Tabs } from "src/components/Tabs"

import { AssistantSettings } from "../AssistantPage/AssistantSettings"
import { ServerSettings } from "../ServerPage/ServerSettings"
import { PortfolioSettings } from "./PortfolioSettings"

export default function SettingsPage({ show }: { show: boolean }) {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "portfolio"

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <Stack>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Tabs value={tab} defaultValue={tab} largeSize>
            <NavTab value="portfolio" to={"?tab=portfolio"} label="Portfolio" />
            <NavTab value="server" to={"?tab=server"} label="Server" />
            <NavTab value="assistant" to={"?tab=assistant"} label="Assistant" />
          </Tabs>
        </Stack>
        {tab === "portfolio" && <PortfolioSettings />}
        {tab === "server" && <ServerSettings />}
        {tab === "assistant" && <AssistantSettings />}
      </Stack>
    </StaggeredList>
  )
}
