import { BuildCircle, Error, Lock, PauseCircle, Pending, StopCircle } from "@mui/icons-material"
import { Box, Stack } from "@mui/material"
import React from "react"
import { CloudInstanceStatus } from "src/api/privatecloud-api"

export function ServerStatusIcon({ status }: { status?: CloudInstanceStatus }) {
  if (status === "running") {
    return (
      <Box
        sx={{
          "&::after": {
            animation: "pulse 1s infinite ease-in-out",
            backgroundColor: "var(--mui-palette-success-main)",
            borderRadius: "50%",
            content: '""',
            height: "13px",
            left: 0,
            position: "absolute",
            width: "13px",
          },
          "@keyframes pulse": {
            "0%": {
              opacity: 1,
              transform: "scale(.75)",
            },
            "100%": {
              opacity: 0,
              transform: "scale(2.5)",
            },
          },
          backgroundColor: "var(--mui-palette-success-main)",
          borderRadius: "50%",
          height: "13px",
          margin: "2px",
          position: "relative",
          width: "13px",
        }}
      />
    )
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

  if (status === "restarting" || status === "creating") {
    return <Pending sx={{ height: 20, width: 20 }} color="primary" />
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
