import { MenuItem, MenuItemProps, Tooltip, TooltipProps } from "@mui/material"
import React from "react"

export function MenuItemWithTooltip(
  props: MenuItemProps & { tooltipProps: Omit<TooltipProps, "children"> }
) {
  const { tooltipProps, ...rest } = props
  return (
    <Tooltip {...tooltipProps}>
      <MenuItem {...rest} />
    </Tooltip>
  )
}
