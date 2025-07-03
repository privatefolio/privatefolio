import { Settings } from "@mui/icons-material"
import { Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { NavTab } from "src/components/NavTab"
import { StaggeredList } from "src/components/StaggeredList"
import { Tabs } from "src/components/Tabs"
import { $activeAccount } from "src/stores/account-store"

import { AssistantActions } from "./AssistantActions"
import { AssistantChat } from "./AssistantChat"
import { AssistantChatHistoryTable } from "./AssistantChatHistoryTable"
import { AssistantSettings } from "./AssistantSettings"

export default function AssistantPage({ show }: { show: boolean }) {
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Assistant - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "chat"

  return (
    <StaggeredList component="main" show={show}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Tabs value={tab} defaultValue={tab} largeSize>
          <NavTab value="chat" to={"?tab=chat&new=true"} label="Chat" />
          <NavTab value="history" to={"?tab=history"} label="History" />
          <NavTab value="settings" to={"?tab=settings"} label={<Settings fontSize="small" />} />
        </Tabs>
        <AssistantActions />
      </Stack>
      {tab === "chat" && <AssistantChat />}
      {tab === "settings" && <AssistantSettings />}
      {tab === "history" && <AssistantChatHistoryTable />}
    </StaggeredList>
  )
}
