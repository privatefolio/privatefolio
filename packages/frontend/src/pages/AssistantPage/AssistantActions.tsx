import { AddRounded } from "@mui/icons-material"
import { IconButton, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { AppLink } from "src/components/AppLink"
import { $activeAccountPath } from "src/stores/account-store"

export function AssistantActions() {
  const activeAccountPath = useStore($activeAccountPath)

  return (
    <Tooltip title="New chat">
      <IconButton
        color="secondary"
        component={AppLink}
        href={`${activeAccountPath}/assistant?tab=chat&new=true`}
      >
        <AddRounded />
      </IconButton>
    </Tooltip>
  )
}
