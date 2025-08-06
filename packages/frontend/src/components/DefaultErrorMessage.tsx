import { Paper, Stack, Typography } from "@mui/material"
import React from "react"

export function DefaultErrorMessage(props: { error: Error }) {
  const { error } = props

  return (
    <Paper>
      <Stack gap={2} alignItems="center" justifyContent="center" sx={{ minHeight: 300 }}>
        <Stack gap={1} alignItems="center">
          <Typography color="error" variant="body2" component="div">
            <span>{error.message}</span>
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}
