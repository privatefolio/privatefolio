import { Box, BoxProps, Link as MuiLink, LinkProps as MuiLinkProps } from "@mui/material"
import React, { forwardRef } from "react"
import { Link as RouterLink } from "react-router-dom"
import { isElectron, openExternalLink } from "src/utils/electron-utils"

export type AppLinkProps = BoxProps & {
  href?: string
} & MuiLinkProps

const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>((props, ref) => {
  const { href, onClick, sx, ...rest } = props

  const isLocalLink = href && !(href.includes("http") || href.startsWith("mailto:"))

  if (!href) return <Box ref={ref} onClick={onClick} {...rest} />

  if (isLocalLink) {
    return (
      <Box
        ref={ref}
        component={RouterLink}
        to={href}
        sx={{ color: "inherit", textDecoration: "none", ...sx }}
        {...rest}
      />
    )
  }

  if (isElectron) {
    return (
      <Box
        ref={ref}
        component={MuiLink}
        href={href}
        sx={sx}
        {...rest}
        onClick={(event) => {
          if (onClick) return onClick(event)
          event.preventDefault()
          openExternalLink?.(href)
        }}
      />
    )
  }

  return (
    <Box
      ref={ref}
      component={MuiLink}
      href={href}
      target="_blank"
      sx={sx}
      onClick={onClick}
      {...rest}
    />
  )
})

AppLink.displayName = "AppLink"

export { AppLink }
