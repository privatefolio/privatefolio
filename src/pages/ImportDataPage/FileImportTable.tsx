import { FolderOutlined } from "@mui/icons-material"
import { Stack } from "@mui/material"
import { proxy } from "comlink"
import React, { useEffect, useMemo, useState } from "react"

import { MemoryTable } from "../../components/EnhancedTable/MemoryTable"
import { FileDrop } from "../../components/FileDrop"
import { StaggeredList } from "../../components/StaggeredList"
import { FileImport } from "../../interfaces"
import { HeadCell } from "../../utils/table-utils"
import { clancy } from "../../workers/remotes"
import { FileImportTableRow } from "./FileImportTableRow"

export function FileImportTable() {
  const [showDrop, setShowDrop] = useState<boolean>(false)
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [rows, setRows] = useState<FileImport[]>([])

  useEffect(() => {
    async function fetchData() {
      const start = Date.now()
      const rows = await clancy.getFileImports()
      setQueryTime(Date.now() - start)
      setRows(rows)
      setTimeout(() => {
        setShowDrop(true)
      }, 330)
    }

    fetchData().then()

    const unsubscribePromise = clancy.subscribeToFileImports(
      proxy(async () => {
        await fetchData()
      })
    )

    return () => {
      unsubscribePromise.then((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [])

  const headCells: HeadCell<FileImport>[] = useMemo(
    () => [
      {
        key: "timestamp",
        label: "Imported",
        sortable: true,
      },
      {
        key: "name",
        label: "Name",
        sortable: true,
      },
      {
        key: "size",
        label: "File size",
        numeric: true,
        sortable: true,
      },
      {
        key: "lastModified",
        label: "Last modified",
        sortable: true,
      },
      {
        filterable: true,
        key: "integration" as keyof FileImport,
        label: "Integration",
        sortable: true,
        valueSelector: (row) => row.meta?.integration,
      },
      {
        key: "logs" as keyof FileImport,
        label: "Audit logs",
        numeric: true,
        sortable: true,
        valueSelector: (row) => row.meta?.logs,
      },
      {
        key: "transactions" as keyof FileImport,
        label: "Transactions",
        numeric: true,
        sortable: true,
        valueSelector: (row) => row.meta?.transactions,
      },
      {
        label: "",
      },
    ],
    []
  )

  return (
    <>
      {queryTime !== null && rows.length === 0 ? (
        <FileDrop sx={{ padding: 4 }}>
          <Stack alignItems="center">
            <FolderOutlined sx={{ height: 64, width: 64 }} />
            <span>Nothing to see here...</span>
          </Stack>
        </FileDrop>
      ) : (
        <StaggeredList gap={1}>
          <MemoryTable<FileImport>
            initOrderBy="timestamp"
            headCells={headCells}
            TableRowComponent={FileImportTableRow}
            rows={rows}
            queryTime={queryTime}
            //
          />
          {showDrop && <FileDrop defaultBg="var(--mui-palette-background-default)" />}
        </StaggeredList>
      )}
    </>
  )
}