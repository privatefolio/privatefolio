import { Typography } from "@mui/material"
import React from "react"

export function NoDataAvailable() {
  return (
    <Typography color="text.secondary" variant="body2" component="div">
      <span>No data available...</span>
    </Typography>
  )
}
