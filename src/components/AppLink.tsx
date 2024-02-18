import { Box, BoxProps } from "@mui/material"
import React from "react"
import { Link, LinkProps } from "react-router-dom"

export function AppLink(props: BoxProps & LinkProps) {
  return <Box component={Link} sx={{ color: "inherit", textDecoration: "none" }} {...props} />
}
