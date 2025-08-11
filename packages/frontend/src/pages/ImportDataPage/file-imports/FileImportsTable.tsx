import { Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { FileDrop } from "src/components/FileDrop"
import { FileImport } from "src/interfaces"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { ImportHelp } from "../ImportHelp"
import { FileImportTableRow } from "./FileImportTableRow"

export function FileImportsTable() {
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `File imports - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [rows, setRows] = useState<FileImport[]>([])

  const connectionStatus = useStore($connectionStatus)

  useEffect(() => {
    async function fetchData() {
      const start = Date.now()
      const rows = await rpc.getFileImports(activeAccount)
      setQueryTime(Date.now() - start)
      setRows(rows)
    }

    fetchData().then()

    const subscription = rpc.subscribeToFileImports(activeAccount, fetchData)

    return closeSubscription(subscription, rpc)
  }, [connectionStatus, rpc, activeAccount])

  const headCells: HeadCell<FileImport>[] = useMemo(
    () => [
      {
        key: "timestamp",
        label: "Imported",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
        valueSelector: (row) => row.timestamp || Infinity,
      },
      {
        filterable: true,
        key: "platformId" as keyof FileImport,
        sx: { maxWidth: 40, minWidth: 40, width: 40 },
        valueSelector: (row) => row.meta?.platformId,
      },
      {
        key: "name",
        label: "Name",
        sortable: true,
        sx: { maxWidth: 360, minWidth: 140, width: "100%" },
      },
      {
        key: "size",
        label: "File size",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        key: "lastModified",
        label: "Last modified",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
      },
      {
        key: "logs" as keyof FileImport,
        label: "Audit logs",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 128, minWidth: 128, width: 128 },
        valueSelector: (row) => row.meta?.logs,
      },
      {
        key: "transactions" as keyof FileImport,
        label: "Transactions",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
        valueSelector: (row) => row.meta?.transactions,
      },
      {
        sx: { maxWidth: 60, minWidth: 60, width: 60 },
      },
    ],
    []
  )

  return (
    <Stack gap={1}>
      <MemoryTable<FileImport>
        initOrderBy="timestamp"
        headCells={headCells}
        TableRowComponent={FileImportTableRow}
        rows={rows}
        queryTime={queryTime}
        emptyContent={<FileDrop sx={{ padding: 6 }} size="large" />}
        addNewRow={<FileDrop fullWidth sx={{ borderRadius: 0, paddingX: 1.5 }} />}
      />
      <ImportHelp extensionType="file-import" />
    </Stack>
  )
}
