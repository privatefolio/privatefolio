import { Typography, TypographyProps } from "@mui/material"
import React from "react"

export function SubtitleText(props: TypographyProps) {
  return (
    <Typography
      variant="subtitle2"
      color="text.secondary"
      fontWeight={400}
      letterSpacing="0.03125rem"
      {...props}
    />
  )
}
