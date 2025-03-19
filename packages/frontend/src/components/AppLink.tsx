import { Box, BoxProps } from "@mui/material"
import React, { forwardRef } from "react"
import { Link, LinkProps } from "react-router-dom"

const AppLink = forwardRef<HTMLAnchorElement, BoxProps & LinkProps>((props, ref) => (
  <Box ref={ref} component={Link} sx={{ color: "inherit", textDecoration: "none" }} {...props} />
))

AppLink.displayName = "AppLink"

export { AppLink }
