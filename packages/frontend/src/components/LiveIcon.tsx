import { Box, BoxProps } from "@mui/material"
import React from "react"

export function LiveIcon(props: BoxProps) {
  return (
    <Box
      sx={{
        "&::after": {
          animation: "pulse 1s infinite ease-in-out",
          backgroundColor: "var(--mui-palette-success-main)",
          borderRadius: "50%",
          content: '""',
          height: "13px",
          left: 0,
          position: "absolute",
          width: "13px",
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
        height: "13px",
        margin: "2px",
        position: "relative",
        width: "13px",
      }}
      {...props}
    />
  )
}
