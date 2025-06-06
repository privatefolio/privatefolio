import { Typography, TypographyProps } from "@mui/material"
import React, { FC } from "react"
import { MonoFont } from "src/theme"

interface KeyProps extends Omit<TypographyProps, "variant"> {
  variant?: "default" | "tooltip"
}

const keyVariantStyles = {
  default: {
    background: "var(--mui-palette-action-hover)",
    color: "inherit",
  },
  tooltip: {
    background: "var(--mui-palette-background-default)",
    color: "var(--mui-palette-text-secondary)",
  },
}

export const Key: FC<KeyProps> = ({ children, variant = "default", sx, ...props }) => {
  const variantStyles = keyVariantStyles[variant]

  return (
    <Typography
      variant="caption"
      fontFamily={MonoFont}
      sx={{
        ...variantStyles,
        borderRadius: 0.25,
        display: "inline-flex",
        justifyContent: "center",
        lineHeight: 1,
        margin: "1px",
        minWidth: 22,
        paddingX: 0.5,
        paddingY: 0.5,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  )
}

const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)

export const MAIN_KEY = isMac ? "⌘" : "Ctrl"
