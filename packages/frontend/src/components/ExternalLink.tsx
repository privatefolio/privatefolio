import { OpenInNew } from "@mui/icons-material"
import React from "react"

import { AppLink, AppLinkProps } from "./AppLink"

export function ExternalLink({ children, ...rest }: AppLinkProps) {
  return (
    <AppLink underline="hover" color="text.secondary" {...rest}>
      {children}
      <OpenInNew fontSize="inherit" sx={{ marginLeft: 0.5, verticalAlign: "middle" }} />
    </AppLink>
  )
}
