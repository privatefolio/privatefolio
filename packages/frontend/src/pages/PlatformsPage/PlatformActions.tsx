import { VerifiedOutlined, VerifiedRounded } from "@mui/icons-material"
import { IconButton, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { $showSupportedPlatformsOnly } from "src/stores/account-settings-store"

export function PlatformActions() {
  const showSupportedOnly = useStore($showSupportedPlatformsOnly)

  return (
    <>
      <Tooltip title={showSupportedOnly ? `Show only supported platforms` : `Show all platforms`}>
        <IconButton
          color="secondary"
          onClick={() => {
            $showSupportedPlatformsOnly.set(!showSupportedOnly)
          }}
        >
          {showSupportedOnly ? (
            <VerifiedRounded fontSize="small" />
          ) : (
            <VerifiedOutlined fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </>
  )
}
