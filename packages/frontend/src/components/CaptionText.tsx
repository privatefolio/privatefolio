import { Typography, TypographyProps } from "@mui/material"
import React from "react"

export function CaptionText(props: TypographyProps) {
  return (
    <Typography
      color="text.secondary"
      variant="caption"
      fontWeight={300}
      letterSpacing="0.03125rem"
      {...props}
    />
  )
}
