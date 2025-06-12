import {
  ListItemAvatar,
  ListItemText,
  MenuItem,
  MenuItemProps,
  Tooltip,
  useMediaQuery,
} from "@mui/material"
import React, { useEffect, useMemo } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { isInputFocused } from "src/utils/browser-utils"

import { Key } from "./SearchBar/Key"

type NavMenuItemProps = Omit<MenuItemProps<typeof Link>, "style"> & {
  avatar?: React.ReactNode
  label: string
  shortcutKey?: string
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
  const { label, avatar, value, shortcutKey, to, ...rest } = props

  const location = useLocation()
  const { pathname } = location
  const appPath = pathname.split("/").slice(3).join("/")

  const overriddenPathname = getOverriddenPathname(appPath)

  const navigate = useNavigate()
  useEffect(() => {
    if (!shortcutKey) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInputFocused()) return
      if (event.ctrlKey || event.metaKey) return

      if (event.key.toLowerCase() === shortcutKey.toLowerCase()) {
        if (to && typeof to === "string") {
          navigate(to)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [shortcutKey, navigate, to])

  const shortcutKeyIndex = useMemo(() => {
    if (!shortcutKey) return -1
    return label.toLowerCase().indexOf(shortcutKey.toLowerCase())
  }, [label, shortcutKey])

  const isTablet = useMediaQuery("(max-width: 899px)")

  return (
    <Tooltip
      title={
        shortcutKey ? (
          <>
            {props["aria-label"]} <Key variant="tooltip">{shortcutKey}</Key>
          </>
        ) : undefined
      }
    >
      <MenuItem
        value={value}
        className={overriddenPathname === value ? "Mui-selected" : ""}
        component={Link}
        LinkComponent={Link}
        to={to}
        {...rest}
      >
        {avatar && <ListItemAvatar>{avatar}</ListItemAvatar>}
        <ListItemText
          primary={
            shortcutKeyIndex === -1 || isTablet ? (
              label
            ) : (
              <>
                {label.split("").map((letter, index) => (
                  <span
                    key={index}
                    style={{
                      color:
                        index === shortcutKeyIndex ? "var(--mui-palette-primary-main)" : undefined,
                    }}
                  >
                    {letter}
                  </span>
                ))}
              </>
            )
          }
        />
      </MenuItem>
    </Tooltip>
  )
}
