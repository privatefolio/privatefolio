import { DataArrayRounded } from "@mui/icons-material"
import { Box, Button, Fade, Stack, Typography, TypographyProps } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Timestamp } from "src/interfaces"
import { $activeAccount, $activeAccountPath, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { $rpc } from "src/workers/remotes"

export function NoFilterMatch(props: TypographyProps) {
  return (
    <Typography color="text.secondary" variant="body2" component="div" {...props}>
      <span>No records match the current filters.</span>
    </Typography>
  )
}

export function NoDataButton() {
  const activeAccountPath = useStore($activeAccountPath)
  const connectionStatus = useStore($connectionStatus)
  const [lastTx, setLastTx] = useState<Timestamp | null>(null)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoading(true)
    }, 100)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    function fetchData() {
      rpc.getValue<Timestamp>(activeAccount, "lastTx", 0).then(setLastTx)
    }

    fetchData()

    const subscription = rpc.subscribeToKV<Timestamp>(activeAccount, "lastTx", setLastTx)

    return closeSubscription(subscription, rpc)
  }, [rpc, connectionStatus, activeAccount])

  const dataAvailable = lastTx !== null && lastTx !== 0

  if (dataAvailable)
    return (
      <Fade in={showLoading}>
        <div>
          <NoFilterMatch />
        </div>
      </Fade>
    )

  return (
    <Fade in={showLoading}>
      <Box sx={{ padding: 4, paddingTop: 2 }}>
        <Typography color="text.secondary" variant="body2" component="div">
          <Stack alignItems="center">
            <DataArrayRounded sx={{ height: 64, width: 64 }} />
            <span>No records found…</span>
            <Button
              component={Link}
              to={`${activeAccountPath}/import-data?tab=wizard`}
              sx={{
                background: "rgba(var(--mui-palette-common-onBackgroundChannel) / 0.05)",
                fontSize: "inherit",
                fontWeight: "inherit",
                marginTop: 1,
                paddingX: 2,
                paddingY: 1,
              }}
            >
              <span>
                Visit <u>Data</u> to get started.
              </span>
            </Button>
          </Stack>
        </Typography>
      </Box>
    </Fade>
  )
}
