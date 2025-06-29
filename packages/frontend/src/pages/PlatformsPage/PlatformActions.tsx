import { VerifiedOutlined, VerifiedRounded } from "@mui/icons-material"
import { IconButton, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { $hideUnsupportedPlatforms } from "src/stores/device-settings-store"

export function PlatformActions() {
  const hideUnsupportedPlatforms = useStore($hideUnsupportedPlatforms)

  return (
    <>
      <Tooltip
        title={hideUnsupportedPlatforms ? `Show only supported platforms` : `Show all platforms`}
      >
        <IconButton
          color="secondary"
          onClick={() => {
            $hideUnsupportedPlatforms.set(!hideUnsupportedPlatforms)
          }}
        >
          {hideUnsupportedPlatforms ? (
            <VerifiedRounded fontSize="small" />
          ) : (
            <VerifiedOutlined fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </>
  )
}
