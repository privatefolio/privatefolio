import { Box, BoxProps, Link as MuiLink } from "@mui/material"
import React, { forwardRef } from "react"
import { Link as RouterLink } from "react-router-dom"

type AppLinkProps = BoxProps & {
  href?: string
}

const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>((props, ref) => {
  const { href } = props

  const isLocalLink = href && !href.includes("http")

  if (!href) return <Box ref={ref} {...props} />

  return (
    <Box
      ref={ref}
      component={isLocalLink ? RouterLink : MuiLink}
      href={isLocalLink ? undefined : href}
      to={isLocalLink ? href : undefined}
      target={!isLocalLink ? "_blank" : undefined}
      sx={{ color: "inherit", textDecoration: "none" }}
      {...props}
    />
  )
})

AppLink.displayName = "AppLink"

export { AppLink }
