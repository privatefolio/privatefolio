import { ListItemAvatar, ListItemText, MenuItem, MenuItemProps } from "@mui/material"
import React from "react"
import { Link, useLocation } from "react-router-dom"

type NavMenuItemProps = Omit<MenuItemProps<typeof Link>, "style"> & {
  avatar?: React.ReactNode
  label: string
  value: string
}

const getOverriddenPathname = (currentPath: string): string => {
  if (currentPath.includes("asset/")) {
    return "assets"
  }
  if (currentPath.includes("extension/") || currentPath === "extensions") {
    return "extensions"
  }
  if (currentPath.includes("platform/") || currentPath === "platforms") {
    return "platforms"
  }
  return currentPath
}

export function NavMenuItem(props: NavMenuItemProps) {
  const { label, avatar, value, ...rest } = props

  const location = useLocation()
  const { pathname } = location
  const appPath = pathname.split("/").slice(3).join("/")

  const overriddenPathname = getOverriddenPathname(appPath)

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
