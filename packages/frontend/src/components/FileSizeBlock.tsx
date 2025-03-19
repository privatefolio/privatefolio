import { Box, Tooltip, Typography } from "@mui/material"
import React from "react"
import { MonoFont } from "src/theme"
import { formatFileSize, formatNumber } from "src/utils/formatting-utils"

type FileSizeBlockProps = {
  size: number
}

export function FileSizeBlock(props: FileSizeBlockProps) {
  const { size } = props

  return (
    <Tooltip
      title={
        // <Stack alignItems="center">
        <Box sx={{ fontFamily: MonoFont }}>
          <span>{formatNumber(size)} Bytes</span>
        </Box>
        // <span className="secondary">(copy to clipboard)</span>
        // </Stack>
      }
    >
      <Typography
        // sx={{ cursor: "pointer" }}
        // onClick={() => {
        //   if (!size) return

        //   navigator.clipboard.writeText(String(size))
        // }}
        fontFamily={MonoFont}
        variant="inherit"
        component="span"
      >
        {formatFileSize(size)}
      </Typography>
    </Tooltip>
  )
}
