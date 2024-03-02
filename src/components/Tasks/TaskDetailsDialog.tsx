import { CloseRounded } from "@mui/icons-material"
import {
  Box,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogProps,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useRef } from "react"
import { $debugMode } from "src/stores/app-store"

import { $pendingTask, $progressHistory, $taskHistory, FinishedTask } from "../../stores/task-store"
import { formatHour } from "../../utils/formatting-utils"
import { SectionTitle } from "../SectionTitle"
import { StaggeredList } from "../StaggeredList"
import { LinearProgressWithLabel } from "./LinearProgressWithLabel"
import { TaskDuration } from "./TaskDuration"

const TimeLabel = ({ timestamp, debugMode }: { debugMode: boolean; timestamp: number }) => (
  <Typography variant="caption" color="text.secondary">
    {formatHour(timestamp, debugMode ? { fractionalSecondDigits: 3 } : { second: "2-digit" })}
  </Typography>
)

export function TaskDetailsDialog({ taskId, ...props }: DialogProps & { taskId: string }) {
  const pendingTask = useStore($pendingTask)
  const taskHistory = useStore($taskHistory)

  const task = useMemo(() => {
    if (pendingTask?.id === taskId) return pendingTask

    return taskHistory.find((task) => task.id === taskId)
  }, [pendingTask, taskHistory, taskId])

  const progressHistory = useStore($progressHistory, { keys: [taskId] })
  const updateMap = progressHistory[taskId]
  const updates = Object.keys(updateMap)
  const completed = task && "completedAt" in task && task.completedAt

  const latestPercentRef = useRef<number>(0)

  const progressPercent = useMemo<number>(() => {
    if (completed && !task.abortController?.signal.aborted && !task?.errorMessage) {
      return 100
    }

    if (!updates?.length) {
      return 0
    }

    const lastUpdate = updates[updates.length - 1]

    const newValue = updateMap[lastUpdate][0]

    if (typeof newValue === "number") {
      latestPercentRef.current = newValue
    }

    return latestPercentRef.current
  }, [completed, task, updateMap, updates])

  const detailsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollToEnd = () => {
      if (detailsRef.current) {
        detailsRef.current.scrollTop = detailsRef.current.scrollHeight
      }
    }

    // Scroll immediately in case content is already loaded
    scrollToEnd()

    // Use setTimeout to delay execution until after the render is complete
    const timer = setTimeout(scrollToEnd, 0)

    // Clear the timeout when the component is unmounted or dependencies change
    return () => clearTimeout(timer)
  }, [updateMap])

  const debugMode = useStore($debugMode)

  if (!task) return null

  return (
    <Dialog
      sx={{
        [`& .MuiDialog-paper`]: {
          margin: 2,
          maxWidth: "min(100%, 480px)",
          minWidth: 320,
          width: 480,
        },
      }}
      // aria-labelledby="task-details-title"
      // aria-describedby="task-details-description"
      {...props}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <span>{task.name}</span>
          <IconButton
            onClick={(event) => props.onClose?.(event, "escapeKeyDown")}
            edge="end"
            color="secondary"
          >
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <StaggeredList gap={1} tertiary>
          <DialogContentText sx={{ mb: 1 }}>{task?.description}</DialogContentText>
          <Stack direction="row" gap={2}>
            <SectionTitle>Progress</SectionTitle>
            <Box sx={{ width: "100%" }}>
              <LinearProgressWithLabel
                color={
                  task.abortController?.signal.aborted
                    ? "secondary"
                    : (task as FinishedTask).errorMessage
                    ? "error"
                    : progressPercent !== 100
                    ? // ? "info"
                      "secondary"
                    : "success"
                }
                sx={{ height: 8 }}
                value={progressPercent}
              />
            </Box>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <SectionTitle>{completed ? "Time" : "Time elapsed"}</SectionTitle>
            <Typography variant="body2">
              <TaskDuration task={task} />
            </Typography>
          </Stack>
          <div>
            <SectionTitle>Details</SectionTitle>
            <Paper
              ref={detailsRef}
              sx={{
                background: "var(--mui-palette-background-default)",
                height: 148,
                marginX: -1,
                maxHeight: 148,
                overflowY: "auto",
                paddingX: 1,
                paddingY: 0.5,
              }}
            >
              <Typography variant="caption" component="div">
                {"startedAt" in task && (
                  <div>
                    <TimeLabel timestamp={task.startedAt as number} debugMode={debugMode} />{" "}
                    Starting task...
                  </div>
                )}
                {updates.map(
                  (update, index) =>
                    typeof updateMap[update][1] === "string" && (
                      <div key={index}>
                        <TimeLabel timestamp={parseInt(update)} debugMode={debugMode} />{" "}
                        {!updateMap[update][1]?.includes("Error") ? (
                          `${updateMap[update][1]}...`
                        ) : (
                          <Typography variant="inherit" color="error" component="span">
                            {updateMap[update][1]}
                          </Typography>
                        )}
                      </div>
                    )
                )}
                {completed && (
                  <div>
                    {task.errorMessage ? (
                      <>
                        <TimeLabel timestamp={task.completedAt as number} debugMode={debugMode} />{" "}
                        <Typography variant="inherit" color="error" component="span">
                          {task.errorMessage}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <TimeLabel timestamp={task.completedAt as number} debugMode={debugMode} />{" "}
                        Task completed!
                      </>
                    )}
                  </div>
                )}
              </Typography>
            </Paper>
          </div>
        </StaggeredList>
      </DialogContent>
    </Dialog>
  )
}
