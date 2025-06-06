import { Box, Typography } from "@mui/material"
import React from "react"
import { MonoFont } from "src/theme"

interface TrustScoreIndicatorProps {
  score: number | undefined | null
}

export function TrustScoreIndicator({ score: initialScore }: TrustScoreIndicatorProps) {
  const score = typeof initialScore === "number" ? initialScore : 0

  let backgroundColor = "var(--mui-palette-error-main)"
  if (score >= 8) {
    backgroundColor = "var(--mui-palette-success-main)"
  } else if (score >= 5) {
    backgroundColor = "var(--mui-palette-warning-main)"
  }

  return (
    <Box
      sx={{
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor,
        borderRadius: "50%",
        display: "flex",
        height: 20,
        justifyContent: "center",
        width: 20,
      }}
    >
      <Typography
        color="background.paper"
        sx={{ fontSize: 10 }}
        lineHeight={1}
        fontFamily={MonoFont}
        fontWeight={600}
      >
        {score}
      </Typography>
    </Box>
  )
}
