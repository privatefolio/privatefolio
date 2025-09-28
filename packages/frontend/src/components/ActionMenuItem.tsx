import { ListItemAvatar, ListItemText, MenuItem, MenuItemProps } from "@mui/material"
import React from "react"
import { ActionId, APP_ACTIONS } from "src/AppActions"

type ActionMenuItemProps = MenuItemProps & {
  id: ActionId
  onFinish: () => void
}

export function ActionMenuItem(props: ActionMenuItemProps) {
  const { id, onFinish, ...rest } = props
  const action = APP_ACTIONS[id]

  return (
    <MenuItem
      onClick={async () => {
        await action.perform()
        onFinish()
      }}
      {...rest}
    >
      <ListItemAvatar>{action.icon}</ListItemAvatar>
      <ListItemText>{action.name}</ListItemText>
    </MenuItem>
  )
}
