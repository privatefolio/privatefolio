import { Paper, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { CircularSpinner } from "src/components/CircularSpinner"
import { $activeAccount } from "src/stores/account-store"
import { MonoFont } from "src/theme"
import { $rpc } from "src/workers/remotes"

export function ServerLogs() {
  const activeAccount = useStore($activeAccount)
  const [logs, setLogs] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    document.title = `Server logs - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  useEffect(() => {
    $rpc
      .get()
      .getServerLogs()
      .then(setLogs)
      .finally(() => setIsLoading(false))
  }, [activeAccount])

  // const connectionStatus = useStore($connectionStatus)

  // useEffect(() => {
  //   const subscription = $rpc.get().subscribeToServerLog((logEntry) => {
  //     setLogs((prevLogs) => `${prevLogs}\n${logEntry}`)
  //   })

  //   return closeSubscription(subscription, $rpc.get())
  // }, [activeAccount, connectionStatus])

  return (
    <Paper sx={{ paddingX: 2, paddingY: 1 }}>
      {isLoading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ height: 400, width: "100%" }}>
          <CircularSpinner color="secondary" />
        </Stack>
      ) : logs.length === 0 ? (
        <Typography variant="body2">Nothing to see here...</Typography>
      ) : (
        <Typography component="pre" variant="caption" fontFamily={MonoFont}>
          {logs}
        </Typography>
      )}
    </Paper>
  )
}
