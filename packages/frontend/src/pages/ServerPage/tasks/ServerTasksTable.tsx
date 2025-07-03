import { AlertTitle, Box, Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Callout } from "src/components/Callout"
import { QueryTableData, RemoteTable } from "src/components/EnhancedTable/RemoteTable"
import { ServerTask } from "src/interfaces"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { ServerTaskTableRow } from "./ServerTaskTableRow"

export function ServerTasksTable() {
  const rpc = useStore($rpc)
  const accountName = useStore($activeAccount)

  useEffect(() => {
    document.title = `Server tasks - ${accountName} - Privatefolio`
  }, [accountName])

  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)

  useEffect(() => {
    const subscription = rpc.subscribeToServerTasks(
      accountName,
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
  }, [accountName, connectionStatus, rpc])

  const queryFn: QueryTableData<ServerTask> = useCallback(
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

      const records = await rpc.getServerTasks(
        accountName,
        `SELECT * FROM server_tasks ${filterQuery} ${orderQuery} ${limitQuery}`
      )

      if (signal?.aborted) throw new Error(signal.reason)

      return [
        records,
        () =>
          rpc.countServerTasks(accountName, `SELECT COUNT (*) FROM server_tasks ${filterQuery}`),
      ]
    },
    [accountName, refresh, rpc]
  )

  const headCells: HeadCell<ServerTask>[] = useMemo(
    () => [
      {
        key: "id",
        label: "Id",
        sortable: true,
        sx: { maxWidth: 80, minWidth: 80, width: 80 },
      },
      {
        key: "createdAt",
        label: "Created",
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
        key: "trigger",
        label: "Trigger",
        sortable: true,
        sx: { maxWidth: 130, minWidth: 130, width: 130 },
      },
      {
        key: "priority",
        label: "Priority",
        sortable: true,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        key: "duration",
        label: "Time",
        sortable: true,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        filterable: true,
        key: "status",
        label: "Status",
        sortable: true,
        sx: { maxWidth: 160, minWidth: 160, width: 160 },
      },
      {
        sx: { maxWidth: 88, minWidth: 88, width: 88 },
      },
    ],
    []
  )

  return (
    <>
      <RemoteTable<ServerTask>
        initOrderBy="id"
        headCells={headCells}
        queryFn={queryFn}
        TableRowComponent={ServerTaskTableRow}
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
