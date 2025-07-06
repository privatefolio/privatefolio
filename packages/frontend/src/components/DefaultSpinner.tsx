import { Fade, Stack } from "@mui/material"
import React, { useEffect, useState } from "react"
import { CircularSpinner, CircularSpinnerProps } from "src/components/CircularSpinner"

export function DefaultSpinner(props: CircularSpinnerProps & { wrapper?: boolean }) {
  const { wrapper = false } = props
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoading(true)
    }, 250)
    return () => clearTimeout(timeout)
  }, [])

  if (!wrapper) {
    return (
      <Fade in={showLoading}>
        <span>
          <CircularSpinner color="secondary" {...props} />
        </span>
      </Fade>
    )
  }

  return (
    <Fade in={showLoading}>
      <Stack
        component="main"
        gap={2}
        alignItems="center"
        justifyContent="center"
        sx={{ height: 300 }}
      >
        <CircularSpinner color="secondary" {...props} />
      </Stack>
    </Fade>
  )
}
