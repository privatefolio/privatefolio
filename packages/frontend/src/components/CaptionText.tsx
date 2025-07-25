import { Typography, TypographyProps } from "@mui/material"
import React from "react"

export function CaptionText(props: TypographyProps) {
  return (
    <Typography color="text.secondary" variant="caption" letterSpacing="0.03125rem" {...props} />
  )
}
