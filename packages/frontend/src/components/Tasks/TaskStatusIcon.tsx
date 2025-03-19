import { Block, CheckRounded, ClearRounded, HourglassEmptyRounded } from "@mui/icons-material"
import React from "react"
import { ServerTask } from "src/interfaces"

import { CircularProgressConnected } from "./CircularProgressConnected"

export function TaskStatusIcon({ task }: { task: ServerTask }) {
  if (task.status === "running") {
    return <CircularProgressConnected task={task} />
  }

  if (task.status === "queued") {
    return <HourglassEmptyRounded sx={{ height: 16, width: 16 }} color="secondary" />
  }

  if (task.status === "completed") {
    return <CheckRounded sx={{ height: 16, width: 16 }} color="success" />
  }

  if (task.status === "failed") {
    return <ClearRounded sx={{ height: 16, width: 16 }} color="error" />
  }

  if (task.status === "cancelled") {
    return <Block sx={{ height: 16, width: 16 }} color="secondary" />
  }

  if (task.status === "aborted") {
    return <Block sx={{ height: 16, width: 16 }} color="error" />
  }

  return null
}
