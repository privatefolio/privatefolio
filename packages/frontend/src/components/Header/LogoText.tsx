import { Typography, TypographyProps } from "@mui/material"
import React from "react"
import { SerifFont } from "src/theme"

export function LogoText(props: TypographyProps) {
  const { children = "Privatefolio", ...rest } = props

  return (
    <Typography
      variant="h5"
      fontFamily={SerifFont}
      fontWeight={600}
      letterSpacing={0.5}
      padding={0}
      {...rest}
    >
      {children}
    </Typography>
  )
}
