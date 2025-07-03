import { AlertTitle, Box, Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Callout } from "src/components/Callout"
import { QueryTableData, RemoteTable } from "src/components/EnhancedTable/RemoteTable"
import { ServerFile } from "src/interfaces"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { ServerFileTableRow } from "./ServerFileTableRow"

export function ServerFilesTable() {
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Server files - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)

  useEffect(() => {
    const subscription = rpc.subscribeToServerFiles(
      activeAccount,
      throttle(
        () => {
          setRefresh(Math.random())
        },
        SHORT_THROTTLE_DURATION,
        {
          leading: false,
          trailing: true,
        }
      )
    )

    return closeSubscription(subscription, rpc)
  }, [activeAccount, connectionStatus, rpc])

  const queryFn: QueryTableData<ServerFile> = useCallback(
    async (filters, rowsPerPage, page, order, signal) => {
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)

      const filterConditions: string[] = []

      Object.keys(filters).forEach((key) => {
        filterConditions.push(`${key} = '${filters[key]}'`)
      })

      let filterQuery = ""
      if (filterConditions.length > 0) {
        filterQuery = "WHERE " + filterConditions.join(" AND ")
      }

      const orderQuery = `ORDER BY id ${order}`
      const limitQuery = `LIMIT ${rowsPerPage} OFFSET ${page * rowsPerPage}`

      const query = `SELECT * FROM server_files ${filterQuery} ${orderQuery} ${limitQuery}`
      const records = await rpc.getServerFiles(activeAccount, query)

      if (signal?.aborted) throw new Error(signal.reason)

      return [
        records,
        () =>
          rpc.countServerFiles(activeAccount, `SELECT COUNT (*) FROM server_files ${filterQuery}`),
      ]
    },
    [activeAccount, refresh, rpc]
  )

  const headCells: HeadCell<ServerFile>[] = useMemo(
    () => [
      {
        key: "id",
        label: "Id",
        sortable: true,
        sx: { maxWidth: 80, minWidth: 80, width: 80 },
      },
      {
        key: "scheduledAt",
        label: "Scheduled",
        sortable: true,
        sx: { maxWidth: 180, minWidth: 180, width: 180 },
        timestamp: true,
      },
      {
        key: "name",
        label: "Name",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
      },
      {
        key: "description",
        label: "Description",
        sortable: true,
      },
      {
        filterable: true,
        key: "createdBy",
        label: "Created by",
        sortable: true,
        sx: { maxWidth: 160, minWidth: 140, width: 160 },
      },
      {
        label: "Time",
        sortable: true,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        sx: { maxWidth: 130, minWidth: 130, width: 130 },
      },
      {
        sx: { maxWidth: 88, minWidth: 88, width: 88 },
      },
    ],
    []
  )

  return (
    <>
      <RemoteTable<ServerFile>
        initOrderBy="id"
        headCells={headCells}
        queryFn={queryFn}
        TableRowComponent={ServerFileTableRow}
      />
      <Stack paddingTop={1}>
        <Callout>
          <AlertTitle>What are server tasks?</AlertTitle>
          <Box sx={{ maxWidth: 590 }}>
            Server tasks allow you to monitor and manage your server.
            <br /> Common tasks include importing transactions, fetching prices or computing your
            net worth.
          </Box>
        </Callout>
      </Stack>
    </>
  )
}
