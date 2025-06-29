import { VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material"
import { IconButton, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { $hideSpam } from "src/stores/device-settings-store"

export function HideSpamToggle() {
  const hideSpam = useStore($hideSpam)

  return (
    <Tooltip title={hideSpam ? "Show spam" : "Hide spam"}>
      <IconButton
        color="secondary"
        onClick={() => {
          $hideSpam.set(!hideSpam)
        }}
      >
        {hideSpam ? (
          <VisibilityOffRounded fontSize="small" />
        ) : (
          <VisibilityRounded fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  )
}
