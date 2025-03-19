import { Block, CheckRounded, HourglassEmptyRounded } from "@mui/icons-material"
import React from "react"
import { ServerFile } from "src/interfaces"

export function FileStatusIcon({ file }: { file: ServerFile }) {
  if (file.status === "scheduled") {
    return <HourglassEmptyRounded sx={{ width: 16 }} color="secondary" />
  }

  if (file.status === "completed") {
    return <CheckRounded sx={{ width: 16 }} color="success" />
  }

  if (file.status === "aborted") {
    return <Block sx={{ width: 16 }} color="error" />
  }

  return null
}
