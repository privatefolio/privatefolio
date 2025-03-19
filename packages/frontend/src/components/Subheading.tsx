import { Stack, Typography, TypographyProps } from "@mui/material"
import React from "react"

import { SerifFont } from "../theme"

export function Subheading({ sx = {}, ...rest }: TypographyProps) {
  return (
    <Typography
      color="primary"
      variant="h6"
      fontFamily={SerifFont}
      sx={{
        "& span": {
          paddingY: 0.25,
        },
        letterSpacing: 0.75,
        minHeight: 45,
        paddingLeft: 2,
        ...sx,
      }}
      component={Stack}
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      {...rest}
    />
  )
}
