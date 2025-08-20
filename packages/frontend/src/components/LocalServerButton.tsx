import { DnsRounded } from "@mui/icons-material"
import { Badge, IconButton, Stack, Tooltip } from "@mui/material"
import { capitalize } from "privatefolio-backend/src/utils/formatting-utils"
import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import { ServerStatusIcon } from "src/components/ServerStatusIcon"
import { useLocalServer } from "src/hooks/useLocalServer"

import { CircularSpinner } from "./CircularSpinner"

const title = "Local server"

export function LocalServerButton() {
  const { connectionStatus, connectionStatusText, serverStatus, localServerEnabled, loading } =
    useLocalServer()

  const status = useMemo(() => {
    if (serverStatus === "running" && connectionStatus === "connected") return "running"
    if (serverStatus !== "running") return serverStatus
    if (connectionStatus === "closed") return connectionStatus
  }, [serverStatus, connectionStatus])

  const tooltipText = useMemo(() => {
    if (serverStatus !== "running") return capitalize(serverStatus)
    if (connectionStatus === "closed") return connectionStatusText
  }, [serverStatus, connectionStatus, connectionStatusText])

  if (!localServerEnabled) return null

  return (
    <Tooltip
      title={
        <Stack alignItems="center">
          <Stack direction="row" alignItems="center" gap={0.5}>
            {title}
            <ServerStatusIcon status={status} size={16} />
          </Stack>
          <span className="secondary">{tooltipText}</span>
        </Stack>
      }
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        sx={{
          "& .MuiBadge-badge": { bottom: 8, pointerEvents: "none", right: 8 },
        }}
        badgeContent={
          <Stack
            sx={{
              backgroundColor: "var(--mui-palette-background-default)",
              borderRadius: "50%",
            }}
            alignItems="center"
            justifyContent="center"
          >
            {status !== "running" && <ServerStatusIcon status={status} size={16} />}
          </Stack>
        }
      >
        <IconButton color="secondary" component={Link} to="/local">
          <DnsRounded />
          {loading && (
            <CircularSpinner
              size={38}
              rootSx={{
                left: 1,
                pointerEvents: "none",
                position: "absolute",
                top: 1,
              }}
              color="secondary"
              bgColor="transparent"
            />
          )}
        </IconButton>
      </Badge>
    </Tooltip>
  )
}
