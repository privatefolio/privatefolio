import { VerifiedRounded } from "@mui/icons-material"
import { Tooltip } from "@mui/material"
import React from "react"

export function SupportedCheckmark(props: { extensions?: string[]; hideTooltip?: boolean }) {
  const { extensions, hideTooltip } = props

  if (!extensions?.length || extensions.length === 0) return null

  return (
    <Tooltip title={hideTooltip ? null : `Supported by ${extensions?.length} extensions`}>
      <VerifiedRounded color="primary" fontSize="inherit" sx={{ verticalAlign: "middle" }} />
    </Tooltip>
  )
}
