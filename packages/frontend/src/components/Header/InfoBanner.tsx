import { Slide, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { $infoBanner } from "src/stores/info-banner-store"

export function InfoBanner() {
  const infoBanner = useStore($infoBanner)
  const [showing, setShowing] = useState(false)

  useEffect(() => {
    if (infoBanner && !showing) {
      setTimeout(() => {
        setShowing(true)
      }, 1_000)
    }

    if (!infoBanner && showing) {
      setTimeout(() => {
        setShowing(false)
      }, 1_000)
    }
  }, [infoBanner, showing])

  return (
    <Slide in={showing} direction="up">
      <Stack
        sx={{
          background: "var(--mui-palette-warning-main)",
          bottom: 0,
          maxWidth: 1536 - 32,
          position: "fixed",
          width: "100%",
          zIndex: "var(--mui-zIndex-tooltip)",
        }}
        alignItems="center"
      >
        <Typography paddingY={0.25} variant="caption" color="#fff">
          {infoBanner}
        </Typography>
      </Stack>
    </Slide>
  )
}
