import { Add, CloudOutlined } from "@mui/icons-material"
import { AlertTitle, Box, Button, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { atom } from "nanostores"
import React, { useEffect, useMemo, useState } from "react"
import { AttentionBlock } from "src/components/AttentionBlock"
import { Callout } from "src/components/Callout"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { Connection } from "src/interfaces"
import { $showActiveConnectionsOnly } from "src/stores/account-settings-store"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { AddConnectionDrawer } from "./AddConnectionDrawer"
import { ConnectionTableRow } from "./ConnectionTableRow"

const $drawerOpen = atom(false)

export function ConnectionsTable() {
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const showActiveConnectionsOnly = useStore($showActiveConnectionsOnly)

  useEffect(() => {
    document.title = `Connections - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])

  const connectionStatus = useStore($connectionStatus)

  useEffect(() => {
    async function fetchData() {
      const start = Date.now()
      const data = await rpc.getConnections(activeAccount)
      setQueryTime(Date.now() - start)
      setConnections(data)
    }

    fetchData().then()

    const subscription = rpc.subscribeToConnections(activeAccount, fetchData)

    return closeSubscription(subscription, rpc)
  }, [connectionStatus, rpc, activeAccount])

  const rows = useMemo(() => {
    if (showActiveConnectionsOnly) {
      return connections.filter((connection) => !connection.meta || connection.meta.logs > 0)
    }
    return connections
  }, [connections, showActiveConnectionsOnly])

  const headCells: HeadCell<Connection>[] = useMemo(
    () => [
      {
        key: "connectionNumber",
        label: "#",
        sortable: true,
        sx: { maxWidth: 80, minWidth: 80, width: 80 },
      },
      {
        key: "syncedAt",
        label: "Synced at",
        sortable: true,
        sx: { maxWidth: 180, minWidth: 180, width: 180 },
        timestamp: true,
      },
      {
        filterable: true,
        key: "platformId",
        sx: { maxWidth: 40, minWidth: 40, width: 40 },
      },
      {
        key: "address",
        label: "Wallet",
        sortable: true,
        // sx: { maxWidth: 420, minWidth: 300, width: 420 },
      },
      {
        key: "logs" as keyof Connection,
        label: "Audit logs",
        numeric: true,
        // valueSelector: (row) => row.meta?.logs,
        sx: { maxWidth: 128, minWidth: 128, width: 128 },
      },
      {
        key: "transactions" as keyof Connection,
        label: "Transactions",
        numeric: true,
        // valueSelector: (row) => row.meta?.transactions,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        sx: { maxWidth: 60, minWidth: 60, width: 60 },
      },
    ],
    []
  )

  return (
    <>
      <MemoryTable<Connection>
        initOrderBy="connectionNumber"
        headCells={headCells}
        TableRowComponent={ConnectionTableRow}
        rows={rows}
        queryTime={queryTime}
        emptyContent={
          <Button sx={{ padding: 4 }} onClick={() => $drawerOpen.set(true)}>
            <Typography color="text.secondary" variant="body2" component="div">
              <Stack alignItems="center">
                <CloudOutlined sx={{ height: 64, width: 64 }} />
                <span>
                  Click to <u>add a new connection</u>.
                </span>
              </Stack>
            </Typography>
          </Button>
        }
        addNewRow={
          <AttentionBlock component={Button} onClick={() => $drawerOpen.set(true)} fullWidth>
            <Add sx={{ height: 20, width: 20 }} />
            <span>
              Click to <u>add a new connection</u>.
            </span>
          </AttentionBlock>
        }
      />
      <Stack paddingTop={1}>
        <Callout>
          <AlertTitle>What are connections?</AlertTitle>
          <Box sx={{ maxWidth: 590 }}>
            Connections allow you to import data without having to manually upload <code>.csv</code>{" "}
            files.
            <br /> Connections can retrieve information from the public blockchain, given a public
            wallet address, or from a supported exchange given an API Key.
          </Box>
        </Callout>
      </Stack>
      <AddConnectionDrawer atom={$drawerOpen} />
    </>
  )
}
