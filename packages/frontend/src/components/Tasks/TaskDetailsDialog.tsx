import { CloseRounded, Fullscreen, FullscreenExit } from "@mui/icons-material"
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
  useMediaQuery,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useBoolean } from "src/hooks/useBoolean"
import { ProgressLog, ServerTask } from "src/interfaces"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { closeSubscription } from "src/utils/browser-utils"
import { parseProgressLog } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import { formatHour } from "../../utils/formatting-utils"
import { SectionTitle } from "../SectionTitle"
import { StaggeredList } from "../StaggeredList"
import { Truncate } from "../Truncate"
import { LinearProgressWithLabel } from "./LinearProgressWithLabel"
import { TaskDuration } from "./TaskDuration"

const TimeLabel = ({ timestamp, debugMode }: { debugMode: boolean; timestamp: number }) => (
  <Typography variant="caption" color="text.secondary">
    {formatHour(timestamp, debugMode ? { fractionalSecondDigits: 3 } : { second: "2-digit" })}
  </Typography>
)

export function TaskDetailsDialog({ task, ...props }: DialogProps & { task: ServerTask }) {
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>()
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    rpc
      .getServerTaskLog(activeAccount, task.id)
      .then((text) => {
        return text
          .split("\n")
          .map((logEntry) => {
            try {
              return parseProgressLog(logEntry)
            } catch {
              return null
            }
          })
          .filter((x) => x !== null)
      })
      .then(setProgressLogs)
  }, [rpc, task, activeAccount])

  const connectionStatus = useStore($connectionStatus)

  useEffect(() => {
    if (task.status !== "running") return

    const subscription = rpc.subscribeToServerTaskProgress(activeAccount, task.id, (logEntry) => {
      setProgressLogs((prevLogs) => {
        try {
          const parsedLog = parseProgressLog(logEntry)
          return [...(prevLogs ?? []), parsedLog]
        } catch {
          return prevLogs
        }
      })
    })

    return closeSubscription(subscription, rpc)
  }, [rpc, task, connectionStatus, activeAccount])

  const progressPercent = useMemo<number>(() => {
    if (task.status === "completed") {
      return 100
    }

    const lastProgressLog = progressLogs?.findLast((log) => typeof log[1][0] === "number")

    if (lastProgressLog !== undefined) {
      return lastProgressLog[1][0] as number
    }

    return 0
  }, [task, progressLogs])

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
  }, [progressLogs])

  const debugMode = useStore($debugMode)
  const isDesktop = useMediaQuery("(min-width: 900px)")
  const { value: fullscreen, toggle: toggleFullscreen } = useBoolean(false)

  if (!task) return null

  return (
    <Dialog
      sx={{
        "& .MuiDialog-paper.MuiDialog-paperFullScreen .details": {
          maxHeight: "calc(100vh - 218px)",
          minHeight: "calc(100vh - 218px)",
        },
        "& .MuiDialog-paper:not(.MuiDialog-paperFullScreen)": {
          height: 500,
          minWidth: 320,
          width: 800,
        },
        "& .MuiDialog-paper:not(.MuiDialog-paperFullScreen) .details": {
          maxHeight: 280,
          minHeight: 280,
        },
      }}
      fullScreen={fullscreen || undefined}
      // aria-labelledby="task-details-title"
      // aria-describedby="task-details-description"
      {...props}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Truncate>{task.name}</Truncate>
          <Stack direction="row">
            {isDesktop && (
              <IconButton onClick={toggleFullscreen} color="secondary">
                {fullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
              </IconButton>
            )}
            <IconButton
              onClick={(event) => props.onClose?.(event, "escapeKeyDown")}
              edge="end"
              color="secondary"
              aria-label="Close dialog"
            >
              <CloseRounded fontSize="small" />
            </IconButton>
          </Stack>
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
                  task.status === "cancelled"
                    ? "secondary"
                    : task.errorMessage
                      ? "error"
                      : progressPercent !== 100
                        ? "secondary"
                        : "success"
                }
                sx={{ height: 8 }}
                value={progressPercent}
              />
            </Box>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <SectionTitle>Time</SectionTitle>
            <Typography variant="body2" color="text.secondary">
              <TaskDuration task={task} />
            </Typography>
          </Stack>
          <div>
            <SectionTitle>Details</SectionTitle>
            <Paper
              className="details"
              ref={detailsRef}
              sx={{
                background: "var(--mui-palette-background-default)",
                height: "100%",
                marginX: -1,
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
                {/* Only show updates that contain a message */}
                {progressLogs?.map((log, index) =>
                  !log[1][1] ? null : (
                    <div key={index}>
                      <TimeLabel timestamp={log[0]} debugMode={debugMode} />{" "}
                      {!log[1][1]?.includes("Error") ? (
                        `${log[1][1]}...`
                      ) : (
                        <Typography variant="inherit" color="error" component="span">
                          {log[1][1]}
                        </Typography>
                      )}
                    </div>
                  )
                )}
                {task.status === "completed" && (
                  <div>
                    <TimeLabel timestamp={task.completedAt as number} debugMode={debugMode} /> Task
                    completed!
                  </div>
                )}
                {(task.status === "failed" ||
                  task.status === "aborted" ||
                  task.status === "cancelled") && (
                  <div>
                    <TimeLabel timestamp={task.completedAt as number} debugMode={debugMode} />{" "}
                    <Typography variant="inherit" color="error" component="span">
                      {task.errorMessage}
                    </Typography>
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
