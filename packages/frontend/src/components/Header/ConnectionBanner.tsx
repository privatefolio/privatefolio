import { Slide, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import type { ReadableAtom } from "nanostores"
import React, { useEffect, useState } from "react"

interface InfoBannerProps {
  prefix?: string
  statusAtom: ReadableAtom<"closed" | "connected" | undefined>
  statusTextAtom: ReadableAtom<string | undefined>
}

export function ConnectionBanner({ statusAtom, statusTextAtom, prefix }: InfoBannerProps) {
  const status = useStore(statusAtom)
  const statusText = useStore(statusTextAtom)
  const [showing, setShowing] = useState(false)

  useEffect(() => {
    let showTimerId: number | undefined
    let hideTimerId: number | undefined

    if (status === "closed" && !showing) {
      showTimerId = window.setTimeout(() => {
        setShowing(true)
      }, 0)
    } else if (status === "connected" && showing) {
      hideTimerId = window.setTimeout(() => {
        setShowing(false)
      }, 4_000)
    }

    return () => {
      if (showTimerId) window.clearTimeout(showTimerId)
      if (hideTimerId) window.clearTimeout(hideTimerId)
    }
  }, [status, showing])

  return (
    <Slide in={showing} direction="up" mountOnEnter unmountOnExit>
      <Stack
        sx={{
          background: statusText
            ? "var(--mui-palette-error-dark)"
            : "var(--mui-palette-success-dark)",
          width: "100%",
        }}
        alignItems="center"
      >
        <Typography paddingY={0.25} variant="caption" color="#fff">
          {prefix}
          {prefix && " "}
          {statusText ? `lost - ${statusText}` : "restored"}
        </Typography>
      </Stack>
    </Slide>
  )
}
