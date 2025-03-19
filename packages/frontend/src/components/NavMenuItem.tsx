import { ListItemAvatar, ListItemText, MenuItem, MenuItemProps } from "@mui/material"
import React from "react"
import { Link, useLocation } from "react-router-dom"

type NavMenuItemProps = Omit<MenuItemProps<typeof Link>, "style"> & {
  avatar?: React.ReactNode
  label: string
  value: string
}

export function NavMenuItem(props: NavMenuItemProps) {
  const { label, avatar, value, ...rest } = props

  const location = useLocation()
  const { pathname } = location
  const appPath = pathname.split("/").slice(3).join("/")
  const overriddenPathname = appPath.includes("asset/") ? "assets" : appPath

  return (
    <MenuItem
      value={value}
      className={overriddenPathname === value ? "Mui-selected" : ""}
      component={Link}
      LinkComponent={Link}
      {...rest}
    >
      {avatar && <ListItemAvatar>{avatar}</ListItemAvatar>}
      <ListItemText primary={label} />
    </MenuItem>
  )
}
