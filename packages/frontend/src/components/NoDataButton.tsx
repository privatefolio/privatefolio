import { DataArrayRounded } from "@mui/icons-material"
import { Box, Button, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Timestamp } from "src/interfaces"
import { $activeAccount, $activeAccountPath, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { $rpc } from "src/workers/remotes"

export function NoDataButton() {
  const activeAccountPath = useStore($activeAccountPath)
  const connectionStatus = useStore($connectionStatus)
  const [lastTx, setLastTx] = useState<Timestamp | null>(null)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    function fetchData() {
      rpc.getValue<Timestamp>(activeAccount, "lastTx", 0).then(setLastTx)
    }

    fetchData()

    const subscription = rpc.subscribeToKV<Timestamp>(activeAccount, "lastTx", setLastTx)

    return closeSubscription(subscription, rpc)
  }, [rpc, connectionStatus, activeAccount])

  const dataAvailable = lastTx !== null && lastTx !== 0

  if (dataAvailable) {
    return (
      <Typography color="text.secondary" variant="body2" component="div">
        <span>No records match the current filters.</span>
      </Typography>
    )
  }

  return (
    <Button sx={{ padding: 4 }} component={Link} to={`${activeAccountPath}/import-data`}>
      <Typography color="text.secondary" variant="body2" component="div">
        <Stack alignItems="center">
          <DataArrayRounded sx={{ height: 64, width: 64 }} />
          <span>No records could be found…</span>
          <Box sx={{ marginTop: 2 }}>
            Visit <u>Data</u> to get started.
          </Box>
        </Stack>
      </Typography>
    </Button>
  )
}
