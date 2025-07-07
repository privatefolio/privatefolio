import { ConstructionRounded } from "@mui/icons-material"
import { AlertTitle, Box, Chip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { AppLink } from "src/components/AppLink"
import { Callout } from "src/components/Callout"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { StaggeredList } from "src/components/StaggeredList"
import { Subheading } from "src/components/Subheading"
import { WorkInProgressCallout } from "src/components/WorkInProgressCallout"
import { RichExtension } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { ExtensionTableRow } from "./ExtensionTableRow"

export default function ExtensionsPage({ show }: { show: boolean }) {
  const [extensions, setExtensions] = useState<RichExtension[]>([])
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const accountName = useStore($activeAccount)
  const rpc = useStore($rpc)

  useEffect(() => {
    document.title = `Extensions - ${accountName} - Privatefolio`
  }, [accountName])

  useEffect(() => {
    const loadExtensions = async () => {
      const start = Date.now()
      const data = await rpc.getExtensions()
      setQueryTime(Date.now() - start)
      setExtensions(data)
    }
    loadExtensions()
  }, [rpc])

  const headCells: HeadCell<RichExtension>[] = useMemo(
    () => [
      {
        key: "extensionName",
        label: "Name",
        sortable: true,
        sx: { maxWidth: 150, minWidth: 150, width: 150 },
      },
      {
        key: "description",
        label: "Description",
        sortable: true,
        sx: { maxWidth: 340, minWidth: 340, width: 340 },
      },
      {
        filterable: true,
        key: "extensionType",
        label: "Type",
        sortable: true,
        sx: { maxWidth: 130, minWidth: 130, width: 130 },
      },
      {
        label: "Version",
        sortable: true,
        sx: { maxWidth: 60, minWidth: 60, width: 60 },
      },
      {
        // filterable: true,
        key: "authorGithub",
        label: "Author",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
      },
      {
        // filterable: true,
        // key: "platforms",
        label: "Platforms",
        // sortable: true,
        sx: { maxWidth: 340, minWidth: 340, width: 340 },
      },
      {
        key: "priceUsd",
        label: "Price",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 80, minWidth: 80, width: 80 },
      },
    ],
    []
  )

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <div>
        <Subheading>
          <span>Extensions</span>
        </Subheading>
        <MemoryTable<RichExtension>
          initOrderBy="priceUsd"
          initOrderDir="desc"
          headCells={headCells}
          TableRowComponent={ExtensionTableRow}
          rows={extensions}
          rowCount={extensions.length}
          queryTime={queryTime}
          nullishSortPosition="start"
        />
      </div>
      <Callout>
        <AlertTitle>What are extensions?</AlertTitle>
        <Box>
          Extensions allow developers to extend the functionality of Privatefolio.
          <br />
          They can be used to import data from a new blockchain, export data to other apps, provide
          custom analytics or AI capabilities.
        </Box>
      </Callout>
      <WorkInProgressCallout />
      <Callout icon={<ConstructionRounded fontSize="inherit" />}>
        <AlertTitle>
          Build extensions, earn money!{" "}
          <Chip size="small" sx={{ fontSize: "0.625rem", height: 20 }} label="New" />
        </AlertTitle>
        <Box>
          If you are a developer, extend Privatefolio and earn a share of the revenue.
          <br />
          Soon you will be able to sell your extensions to other users for a flat fee or a recurring
          subscription.
          <br />
          Tag @kernelwhisperer in <AppLink href="https://discord.gg/YHHu9nK8VD">Discord</AppLink> to
          learn more.
        </Box>
      </Callout>
    </StaggeredList>
  )
}
