import { Tooltip, Typography, TypographyProps } from "@mui/material"
import { a, useSpring } from "@react-spring/web"
import React, { useEffect, useState } from "react"
import { ServerTask } from "src/interfaces"

import { formatDuration } from "../../utils/formatting-utils"

type TaskDurationProps = TypographyProps & {
  task: ServerTask
}

export function TaskDuration(props: TaskDurationProps) {
  const { task, ...rest } = props

  const hasDuration = "duration" in task
  const initialTime = hasDuration
    ? (task.duration as number)
    : task.startedAt !== undefined
      ? Date.now() - task.startedAt
      : 0

  const [time, setTime] = useState(initialTime)

  useEffect(() => {
    if (task.status !== "running") return

    setTime(Date.now() - (task.startedAt as number) + 900)
    const interval = setInterval(() => {
      setTime(Date.now() - (task.startedAt as number) + 900)
    }, 1000)

    return () => clearInterval(interval)
  }, [task])

  useEffect(() => {
    if ("duration" in task) {
      setTime(task.duration as number)
    }
  }, [task])

  const style = useSpring({
    config: { duration: 1000 },
    from: { time: hasDuration ? initialTime : initialTime },
    time,
  })

  return (
    <Tooltip title={formatDuration(time, true)}>
      <Typography variant="inherit" component="span" {...rest}>
        {/* https://github.com/pmndrs/react-spring/issues/1461 */}
        {task.status === "running" ? (
          <a.span>{style.time.to((x) => formatDuration(x))}</a.span>
        ) : (
          formatDuration(time)
        )}
      </Typography>
    </Tooltip>
  )
}
