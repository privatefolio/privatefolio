import { DataArrayRounded } from "@mui/icons-material"
import { Box, Button, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Timestamp } from "src/interfaces"
import { $activeAccount, $activeIndex, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { $rpc } from "src/workers/remotes"

export function NoDataButton() {
  const activeIndex = useStore($activeIndex)
  const connectionStatus = useStore($connectionStatus)
  const [lastTx, setLastTx] = useState<Timestamp | null>(null)

  useEffect(() => {
    function fetchData() {
      $rpc.get().getValue<Timestamp>($activeAccount.get(), "lastTx", 0).then(setLastTx)
    }

    fetchData()

    const subscription = $rpc
      .get()
      .subscribeToKV<Timestamp>($activeAccount.get(), "lastTx", setLastTx)

    return closeSubscription(subscription, $rpc.get())
  }, [connectionStatus])

  const dataAvailable = lastTx !== null && lastTx !== 0

  if (dataAvailable) {
    return (
      <Typography color="text.secondary" variant="body2" component="div">
        <span>No records match the current filters.</span>
      </Typography>
    )
  }

  return (
    <Button sx={{ padding: 4 }} component={Link} to={`/u/${activeIndex}/import-data`}>
      <Typography color="text.secondary" variant="body2" component="div">
        <Stack alignItems="center">
          <DataArrayRounded sx={{ height: 64, width: 64 }} />
          <span>No records could be found...</span>
          <Box sx={{ marginTop: 2 }}>
            Visit <u>Data</u> to get started.
          </Box>
        </Stack>
      </Typography>
    </Button>
  )
}
