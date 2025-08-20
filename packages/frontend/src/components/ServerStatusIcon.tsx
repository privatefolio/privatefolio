import { BuildCircle, Error, Lock, PauseCircle, StopCircle } from "@mui/icons-material"
import { Stack } from "@mui/material"
import React from "react"
import { CloudInstanceStatus } from "src/api/privatecloud-api"
import { PulsatingDot } from "src/components/PulsatingDot"
import { ConnectionStatus, LocalServerStatus } from "src/interfaces"

export function ServerStatusIcon({
  size = 20,
  status,
}: {
  size?: number
  status?: CloudInstanceStatus | ConnectionStatus | LocalServerStatus
}) {
  if (status === "running" || status === "connected") {
    return <PulsatingDot size={size} />
  }

  if (status === "paused") {
    return <PauseCircle sx={{ height: size, width: size }} color="warning" />
  }

  if (status === "errored" || status === "closed") {
    return <Error sx={{ height: size, width: size }} color="error" />
  }

  if (status === "unknown") {
    return <Error sx={{ height: size, width: size }} color="warning" />
  }

  if (status === "restarting" || status === "creating" || status === "pending") {
    // <Pending sx={{ height: 20, width: 20 }} color="primary" />
    return null
  }

  if (status === "stopped") {
    return <StopCircle sx={{ height: size, width: size }} color="error" />
  }

  if (status === "needs setup") {
    return <BuildCircle sx={{ height: size, width: size }} color="warning" />
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
            height: size - 6,
            margin: "2px",
            width: size - 6,
          }}
        />
      </Stack>
    )
  }

  return null
}
