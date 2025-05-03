import { Stack, StackProps, Typography } from "@mui/material"
import React from "react"

import { SerifFont } from "../../theme"

export function Logo(props: StackProps) {
  return (
    <Stack direction="row" gap={1} alignItems="center" {...props}>
      <Typography
        variant="h5"
        fontFamily={SerifFont}
        fontWeight={800}
        letterSpacing={0.5}
        padding={0}
      >
        Privatefolio
      </Typography>
    </Stack>
  )
}
