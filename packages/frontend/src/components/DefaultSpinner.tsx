import { Stack } from "@mui/material"
import React from "react"
import { CircularSpinner, CircularSpinnerProps } from "src/components/CircularSpinner"

export function DefaultSpinner(props: CircularSpinnerProps) {
  return (
    <Stack
      component="main"
      gap={2}
      alignItems="center"
      justifyContent="center"
      sx={{ height: 300 }}
    >
      <CircularSpinner color="secondary" {...props} />
    </Stack>
  )
}
