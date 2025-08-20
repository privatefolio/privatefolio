import { Box, BoxProps } from "@mui/material"
import React from "react"

export function PulsatingDot({ size = 20, ...rest }: BoxProps & { size?: number }) {
  return (
    <Box
      sx={{
        "&::after": {
          animation: "pulse 1s infinite ease-in-out",
          backgroundColor: "var(--mui-palette-success-main)",
          borderRadius: "50%",
          content: '""',
          height: size - 6,
          left: 0,
          position: "absolute",
          width: size - 6,
        },
        "@keyframes pulse": {
          "0%": {
            opacity: 1,
            transform: "scale(.75)",
          },
          "100%": {
            opacity: 0,
            transform: "scale(2.5)",
          },
        },
        backgroundColor: "var(--mui-palette-success-main)",
        borderRadius: "50%",
        height: size - 6,
        margin: "2px",
        position: "relative",
        width: size - 6,
      }}
      {...rest}
    />
  )
}
