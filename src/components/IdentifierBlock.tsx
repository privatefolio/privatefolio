import { alpha, Box, Chip, Stack, Tooltip, Typography } from "@mui/material"
import { grey } from "@mui/material/colors"
import React, { useState } from "react"
import { MonoFont } from "src/theme"

import { Truncate } from "./Truncate"

type IdentifierBlockProps = {
  id: string
  size?: "small" | "medium"
}

export function IdentifierBlock(props: IdentifierBlockProps) {
  const { id, size } = props

  const [copied, setCopied] = useState(false)

  return (
    <Tooltip
      title={
        <Stack alignItems="center">
          <Box sx={{ fontFamily: MonoFont, maxWidth: "100%" }}>{id}</Box>
          <span className="secondary">({copied ? "copied" : "copy to clipboard"})</span>
        </Stack>
      }
    >
      <Chip
        size={size}
        sx={{ background: alpha(grey[500], 0.075), boxShadow: "none !important" }}
        onClick={() => {
          navigator.clipboard.writeText(id)

          setCopied(true)

          setTimeout(() => {
            setCopied(false)
          }, 1_000)
        }}
        label={
          <Truncate>
            <Typography fontFamily={MonoFont} variant="inherit" component="span">
              {id}
            </Typography>
          </Truncate>
        }
      />
    </Tooltip>
  )
}
