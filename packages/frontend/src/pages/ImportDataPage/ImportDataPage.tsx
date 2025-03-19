import { Stack } from "@mui/material"
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

const defaultTab = "connections"

export default function ImportDataPage({ show }: { show: boolean }) {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || defaultTab

  useEffect(() => {
    document.title = `Data - ${$activeAccount.get()} - Privatefolio`
  }, [])

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <Stack>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Tabs value={tab} defaultValue={defaultTab} largeSize>
            <NavTab value="connections" to={"?tab=connections"} label="Connections" />
            <NavTab value="file-imports" to={"?tab=file-imports"} label="File imports" />
            <NavTab value="address-book" to={"?tab=address-book"} label="Address book" />
            <NavTab value="tags" to={"?tab=tags"} label="Tags" />
          </Tabs>
          <ImportDataActions />
        </Stack>
        {tab === "file-imports" && <FileImportsTable />}
        {tab === "connections" && <ConnectionsTable />}
        {tab === "address-book" && <AddressBookTable />}
        {tab === "tags" && <TagsTable />}
      </Stack>
    </StaggeredList>
  )
}
