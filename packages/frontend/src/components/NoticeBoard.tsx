import { Stack, Typography } from "@mui/material"
import React from "react"

export default function NoticeBoard() {
  return (
    <Stack
      width="100%"
      sx={{
        alignItems: "center",
        backgroundColor: "var(--mui-palette-background-paper)",
        border: "solid 1px",
        borderColor: "var(--mui-palette-divider)",
        borderLeft: 0,
        borderRight: 0,
        borderTop: 0,
        paddingX: 4,
        paddingY: 0.5,
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={300}>
        Privatefolio v2 is coming up. Back-up your current data before <b>1st of January, 2025</b>!
      </Typography>
    </Stack>
  )
}
