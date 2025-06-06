import { OpenInNew } from "@mui/icons-material"
import { Link, LinkProps } from "@mui/material"
import React from "react"

export function ExternalLink({ children, ...rest }: LinkProps) {
  return (
    <Link underline="hover" color="text.secondary" target="_blank" {...rest}>
      {children}
      <OpenInNew fontSize="inherit" sx={{ marginLeft: 0.5, verticalAlign: "middle" }} />
    </Link>
  )
}
