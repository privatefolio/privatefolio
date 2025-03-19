import { Stack } from "@mui/material"
import React from "react"
import { useSearchParams } from "react-router-dom"
import { NavTab } from "src/components/NavTab"
import { Tabs } from "src/components/Tabs"

import { StaggeredList } from "../../components/StaggeredList"
import { ServerFilesTable } from "./files/ServerFilesTable"
import { ServerActions } from "./ServerActions"
import { ServerInfo } from "./ServerInfo"
import { ServerTasksTable } from "./tasks/ServerTasksTable"

const defaultTab = "tasks"

export default function ServerPage({ show }: { show: boolean }) {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || defaultTab

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <Stack>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Tabs value={tab} defaultValue={defaultTab} largeSize>
            <NavTab value="tasks" to={"?tab=tasks"} label="Tasks" />
            <NavTab value="files" to={"?tab=files"} label="Files" />
            <NavTab value="info" to={"?tab=info"} label="Info" />
          </Tabs>
          <ServerActions />
        </Stack>
        {tab === "tasks" && <ServerTasksTable />}
        {tab === "files" && <ServerFilesTable />}
        {tab === "info" && <ServerInfo />}
      </Stack>
    </StaggeredList>
  )
}
