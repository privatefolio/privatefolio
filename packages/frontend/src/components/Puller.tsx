import { Box } from "@mui/material"
import React from "react"

export function Puller() {
  return (
    <Box
      sx={{
        background: "var(--mui-palette-divider)",
        borderRadius: 3,
        height: 6,
        left: "calc(50% - 15px)",
        position: "absolute",
        top: 8,
        width: 30,
      }}
    />
  )
}
