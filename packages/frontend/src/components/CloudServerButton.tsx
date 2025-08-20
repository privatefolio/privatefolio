import { Cloud } from "@mui/icons-material"
import { Badge, IconButton, Stack, Tooltip } from "@mui/material"
import { capitalize } from "privatefolio-backend/src/utils/formatting-utils"
import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import { ServerStatusIcon } from "src/components/ServerStatusIcon"
import { useCloudServer } from "src/hooks/useCloudServer"

import { CircularSpinner } from "./CircularSpinner"
import { Gravatar } from "./Gravatar"

const title = "Cloud server"

export function CloudServerButton() {
  const { connectionStatus, connectionStatusText, serverStatus, cloudEnabled, cloudUser, loading } =
    useCloudServer()

  const status = useMemo(() => {
    if (cloudUser === null) return "needs login"
    if (serverStatus === "running" && connectionStatus === "connected") return "running"
    if (serverStatus !== "running") return serverStatus
    if (connectionStatus === "closed") return connectionStatus
  }, [cloudUser, serverStatus, connectionStatus])

  const tooltipText = useMemo(() => {
    if (cloudUser === null) return "Login to PrivateCloud™ to get started"
    if (serverStatus !== "running") return capitalize(serverStatus)
    if (connectionStatus === "closed") return connectionStatusText
    if (cloudUser) return cloudUser.email

    return "Login to PrivateCloud™ to get started"
  }, [serverStatus, connectionStatus, connectionStatusText, cloudUser])

  if (!cloudEnabled) return null

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
        <IconButton color="secondary" component={Link} to="/cloud">
          {cloudUser ? (
            <Gravatar email={cloudUser.email} sx={{ height: 24, width: 24 }} />
          ) : (
            <Cloud />
          )}
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
