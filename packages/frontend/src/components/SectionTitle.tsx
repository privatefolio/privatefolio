import { Typography, TypographyProps } from "@mui/material"
import React from "react"

export function SectionTitle(props: TypographyProps & { optional?: boolean }) {
  const { optional, children, ...rest } = props

  return (
    <Typography
      variant="subtitle2"
      color="text.secondary"
      letterSpacing="0.025rem"
      // fontWeight={500} (the default)
      sx={{ marginBottom: 0.5 }}
      {...rest}
    >
      {children} {optional && <Typography variant="caption">(optional)</Typography>}
    </Typography>
  )
}
