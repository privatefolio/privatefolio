import { inputBaseClasses, Stack, TextField } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { QueryTableData, RemoteTable } from "src/components/EnhancedTable/RemoteTable"
import { ServerLog } from "src/interfaces"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { TIMESTAMP_HEADER_SX } from "src/theme"
import { closeSubscription } from "src/utils/browser-utils"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { ServerLogTableRow } from "./logs/ServerLogTableRow"

export function ServerLogs() {
  const activeAccount = useStore($activeAccount)
  const rpc = useStore($rpc)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    document.title = `Server logs - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const connectionStatus = useStore($connectionStatus)

  useEffect(() => {
    const subscription = rpc.subscribeToServerLog(
      throttle(() => {
        setRefresh(Math.random())
      }, SHORT_THROTTLE_DURATION)
    )

    return closeSubscription(subscription, rpc)
  }, [rpc, connectionStatus])

  const [search, setSearch] = useState("")
  const [day, setDay] = useState(new Date())

  const queryFn: QueryTableData<ServerLog> = useCallback(
    async (filters, rowsPerPage, page, order, _signal, orderBy) => {
      const _refresh = refresh
      const result = await rpc.queryServerLogs(
        {
          ...filters,
          search,
        },
        rowsPerPage,
        page,
        order,
        orderBy,
        day.toISOString().slice(0, 10)
      )
      return result
    },
    [rpc, refresh, search, day]
  )

  const headCells: HeadCell<ServerLog>[] = useMemo(
    () => [
      {
        key: "timestamp",
        label: "Created",
        sortable: true,
        sx: TIMESTAMP_HEADER_SX,
      },
      {
        filterable: true,
        key: "level",
        label: "Level",
        sortable: true,
        sx: { maxWidth: 100, minWidth: 100, width: 100 },
      },
      {
        key: "message",
        label: "Message",
      },
      {
        label: (
          <Stack direction="row" gap={1} alignItems="center">
            <TextField
              fullWidth
              size="small"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter logs..."
              sx={{
                [`& .${inputBaseClasses.input}`]: {
                  fontSize: "0.875rem",
                  paddingX: 1.25,
                  paddingY: 0.5,
                },
                [`& .${inputBaseClasses.root}`]: {
                  borderRadius: 2,
                },
              }}
            />
            <DatePicker
              onChange={(newValue) => setDay(newValue ?? new Date())}
              defaultValue={new Date()}
              disableFuture
              sx={{
                minWidth: 160,
                [`& .${inputBaseClasses.input}`]: {
                  fontSize: "0.875rem",
                  paddingX: 1.25,
                  paddingY: 0.5,
                },
                [`& .${inputBaseClasses.root}`]: {
                  borderRadius: 2,
                },
              }}
              slotProps={{
                openPickerButton: {
                  color: "secondary",
                  size: "small",
                },
                textField: {
                  required: true,
                  size: "small",
                },
              }}
            />
          </Stack>
        ),
        // sx: { maxWidth: 60, minWidth: 60, width: 60 },
        sx: { maxWidth: 360, minWidth: 360, width: 360 },
      },
    ],
    []
  )

  return (
    <RemoteTable<ServerLog>
      headCells={headCells}
      queryFn={queryFn}
      TableRowComponent={ServerLogTableRow}
      initOrderBy="timestamp"
      showToolbarAlways
    />
  )
}
