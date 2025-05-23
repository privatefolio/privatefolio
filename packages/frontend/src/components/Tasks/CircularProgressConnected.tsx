import { Box, CircularProgressProps } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { ProgressLog, ServerTask } from "src/interfaces"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { parseProgressLog } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import { CircularSpinner } from "../CircularSpinner"

type CircularProgressConnectedProps = CircularProgressProps & {
  task: ServerTask
}

export function CircularProgressConnected(props: CircularProgressConnectedProps) {
  const { sx = {}, task, ...rest } = props

  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>()
  const connectionStatus = useStore($connectionStatus)

  useEffect(() => {
    const subscription = $rpc
      .get()
      .subscribeToServerTaskProgress($activeAccount.get(), task.id, (logEntry) => {
        setProgressLogs((prevLogs) => {
          try {
            const parsedLog = parseProgressLog(logEntry)
            return [...(prevLogs ?? []), parsedLog]
          } catch {
            return prevLogs
          }
        })
      })

    return closeSubscription(subscription, $rpc.get())
  }, [task.id, connectionStatus])

  const progressPercent = useMemo<number>(() => {
    if (task.status === "completed") {
      return 100
    }

    const lastProgressLog = progressLogs?.findLast((log) => typeof log[1][0] === "number")

    if (lastProgressLog !== undefined) {
      return lastProgressLog[1][0] as number
    }

    return 0
  }, [task, progressLogs])

  return (
    <Box sx={sx} key={task.id}>
      <CircularSpinner
        variant={task.determinate ? "determinate" : "indeterminate"}
        color="secondary"
        size={16}
        thickness={4.5}
        value={progressPercent}
        {...rest}
      />
    </Box>
  )
}
