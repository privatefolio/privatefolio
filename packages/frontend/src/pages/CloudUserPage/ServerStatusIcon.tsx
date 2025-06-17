import { BuildCircle, Error, Lock, PauseCircle, StopCircle } from "@mui/icons-material"
import { Stack } from "@mui/material"
import React from "react"
import { CloudInstanceStatus } from "src/api/privatecloud-api"
import { LiveIcon } from "src/components/LiveIcon"

export function ServerStatusIcon({ status }: { status?: CloudInstanceStatus }) {
  if (status === "running") {
    return <LiveIcon />
  }

  if (status === "paused") {
    return <PauseCircle sx={{ height: 20, width: 20 }} color="warning" />
  }

  if (status === "errored") {
    return <Error sx={{ height: 20, width: 20 }} color="error" />
  }

  if (status === "unknown") {
    return <Error sx={{ height: 20, width: 20 }} color="warning" />
  }

  if (status === "restarting" || status === "creating" || status === "pending") {
    // <Pending sx={{ height: 20, width: 20 }} color="primary" />
    return null
  }

  if (status === "stopped") {
    return <StopCircle sx={{ height: 20, width: 20 }} color="error" />
  }

  if (status === "needs setup") {
    return <BuildCircle sx={{ height: 20, width: 20 }} color="warning" />
  }

  if (status === "needs login") {
    return (
      <Stack
        sx={{
          backgroundColor: "var(--mui-palette-warning-main)",
          borderRadius: "50%",
          margin: "2px",
        }}
        alignItems="center"
        justifyContent="center"
      >
        <Lock
          sx={{
            color: "var(--mui-palette-background-paper)",
            height: 14,
            margin: "2px",
            width: 14,
          }}
        />
      </Stack>
    )
  }

  return null
}
