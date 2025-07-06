import { Paper, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { $activeAccount } from "src/stores/account-store"
import { MonoFont } from "src/theme"
import { $rpc } from "src/workers/remotes"

export function ServerLogs() {
  const activeAccount = useStore($activeAccount)
  const [logs, setLogs] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const rpc = useStore($rpc)
  useEffect(() => {
    document.title = `Server logs - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  useEffect(() => {
    rpc
      .getServerLogs()
      .then(setLogs)
      .finally(() => setIsLoading(false))
  }, [activeAccount, rpc])

  // const connectionStatus = useStore($connectionStatus)

  // useEffect(() => {
  //   const subscription = rpc.subscribeToServerLog((logEntry) => {
  //     setLogs((prevLogs) => `${prevLogs}\n${logEntry}`)
  //   })

  //   return closeSubscription(subscription, rpc)
  // }, [activeAccount, connectionStatus])

  return (
    <Paper sx={{ maxHeight: 800, overflow: "auto", paddingX: 2, paddingY: 1 }}>
      {isLoading ? (
        <DefaultSpinner wrapper />
      ) : logs.length === 0 ? (
        <Typography variant="body2">Nothing to see here…</Typography>
      ) : (
        <Typography component="pre" variant="caption" fontFamily={MonoFont}>
          {logs}
        </Typography>
      )}
    </Paper>
  )
}
