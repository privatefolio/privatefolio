import { Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { NavTab } from "src/components/NavTab"
import { Tabs } from "src/components/Tabs"
import { $activeAccount } from "src/stores/account-store"

import { StaggeredList } from "../../components/StaggeredList"
import { AddressBookTable } from "../AddressBookPage/AddressBookTable"
import { TagsTable } from "../TagsPage/TagsTable"
import { ConnectionsTable } from "./connections/ConnectionsTable"
import { FileImportsTable } from "./file-imports/FileImportsTable"
import { ImportDataActions } from "./ImportDataActions"

export default function ImportDataPage({ show }: { show: boolean }) {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "connections"

  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Data - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <Stack>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Tabs value={tab} defaultValue={tab} largeSize>
            <NavTab value="connections" to={"?tab=connections"} label="Connections" />
            <NavTab value="file-imports" to={"?tab=file-imports"} label="File imports" />
            <NavTab value="address-book" to={"?tab=address-book"} label="Address book" />
            <NavTab value="tags" to={"?tab=tags"} label="Tags" />
          </Tabs>
          <ImportDataActions currentTab={tab} />
        </Stack>
        {tab === "file-imports" && <FileImportsTable />}
        {tab === "connections" && <ConnectionsTable />}
        {tab === "address-book" && <AddressBookTable />}
        {tab === "tags" && <TagsTable />}
      </Stack>
    </StaggeredList>
  )
}
