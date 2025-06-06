import { Settings } from "@mui/icons-material"
import { Stack } from "@mui/material"
import React from "react"
import { useSearchParams } from "react-router-dom"
import { NavTab } from "src/components/NavTab"
import { StaggeredList } from "src/components/StaggeredList"
import { Tabs } from "src/components/Tabs"

import { ServerFilesTable } from "./files/ServerFilesTable"
import { ServerActions } from "./ServerActions"
import { ServerInfo } from "./ServerInfo"
import { ServerLogs } from "./ServerLogs"
import { ServerSettings } from "./ServerSettings"
import { ServerTasksTable } from "./tasks/ServerTasksTable"

export default function ServerPage({ show }: { show: boolean }) {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "tasks"

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <Stack>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Tabs value={tab} defaultValue={tab} largeSize>
            <NavTab value="tasks" to={"?tab=tasks"} label="Tasks" />
            <NavTab value="files" to={"?tab=files"} label="Files" />
            <NavTab value="logs" to={"?tab=logs"} label="Logs" />
            <NavTab value="info" to={"?tab=info"} label="Info" />
            <NavTab value="settings" to={"?tab=settings"} label={<Settings fontSize="small" />} />
          </Tabs>
          <ServerActions />
        </Stack>
        {tab === "tasks" && <ServerTasksTable />}
        {tab === "files" && <ServerFilesTable />}
        {tab === "logs" && <ServerLogs />}
        {tab === "info" && <ServerInfo />}
        {tab === "settings" && <ServerSettings />}
      </Stack>
    </StaggeredList>
  )
}
