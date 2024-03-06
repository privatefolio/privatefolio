import { ListItemAvatar, ListItemText, MenuItem, MenuItemProps } from "@mui/material"
import React from "react"
import { NavLink } from "react-router-dom"

export function NavMenuItem({
  label,
  avatar,
  ...props
}: MenuItemProps<typeof NavLink> & { avatar?: React.ReactNode; label: string; value: string }) {
  return (
    <MenuItem
      sx={{ alignContent: "center", minWidth: 240 }}
      component={NavLink}
      LinkComponent={NavLink}
      {...props}
    >
      {avatar && (
        <ListItemAvatar
          sx={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            marginRight: 2,
            minWidth: 0,
          }}
        >
          {avatar}
        </ListItemAvatar>
      )}
      <ListItemText primary={label} />
    </MenuItem>
  )
}
