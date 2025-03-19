import { Typography, TypographyProps } from "@mui/material"
import React, { FC } from "react"
import { MonoFont } from "src/theme"

export const Key: FC<TypographyProps> = ({ children, ...props }) => {
  return (
    <Typography
      variant="caption"
      fontFamily={MonoFont}
      sx={{
        background: "var(--mui-palette-action-hover)",
        borderRadius: 0.25,
        display: "inline-flex",
        justifyContent: "center",
        lineHeight: 1,
        margin: "1px",
        minWidth: 22,
        paddingX: 0.5,
        paddingY: 0.5,
      }}
      {...props}
    >
      {children}
    </Typography>
  )
}

const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)

export const MAIN_KEY = isMac ? "⌘" : "Ctrl"
