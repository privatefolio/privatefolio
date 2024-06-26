import {
  Block,
  CancelOutlined,
  CheckRounded,
  ClearRounded,
  DoneAllRounded,
  HourglassEmptyRounded,
} from "@mui/icons-material"
import {
  Button,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useState } from "react"

import { $pendingTask, $taskHistory, $taskQueue, cancelTask } from "../../stores/task-store"
import { MonoFont } from "../../theme"
import { Truncate } from "../Truncate"
import { PendingTaskProgress } from "./PendingTaskProgress"
import { TaskDetailsDialog } from "./TaskDetailsDialog"
import { TaskDuration } from "./TaskDuration"

export function TaskDropdown() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const pendingTask = useStore($pendingTask)
  const taskQueue = useStore($taskQueue)
  const taskHistory = useStore($taskHistory)

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  // useEffect(() => {
  //   enqueueTask({
  //     description: "Computing balances",
  //     function: (progress) =>
  //       new Promise((resolve, reject) => {
  //         progress([50, "Almost there"])
  //         setTimeout(() => {
  //           reject(new Error("Something went wrong"))
  //         }, 320)
  //       }),
  //     name: "Computing balances",
  //     priority: 2,
  //   })
  //   enqueueTask({
  //     description: "Fetching price data for all assets",
  //     function: () =>
  //       new Promise((resolve, reject) => {
  //         setTimeout(() => {
  //           reject(new Error("Something went wrong"))
  //         }, 1830)
  //       }),
  //     name: "Fetch prices",
  //     priority: 2,
  //   })
  //   enqueueTask({
  //     description: "Fetching price data for all assets",
  //     determinate: true,
  //     function: (progress, signal) =>
  //       new Promise((resolve, reject) => {
  //         const numbers = Array.from({ length: 10 }, (_, i) => i + 1)
  //         numbers.forEach((number) => {
  //           setTimeout(() => {
  //             if (signal?.aborted) {
  //               reject(new Error(signal.reason))
  //               return
  //             }

  //             progress([
  //               number * 10,
  //               `Fetching price for ${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
  //             ])

  //             if (number === 10) {
  //               resolve(null)
  //             }
  //           }, number * 1000)
  //         })
  //       }),
  //     name: "Import data",
  //     priority: 2,
  //   })
  //   enqueueTask({
  //     description: "Fetching price data for all assets",
  //     function: () =>
  //       new Promise((resolve) => {
  //         setTimeout(() => {
  //           resolve(null)
  //         }, 100)
  //       }),
  //     name: "Compact data",
  //     priority: 2,
  //   })
  // }, [])

  return (
    <>
      <Tooltip title="Tasks">
        <Button
          size="small"
          variant="outlined"
          color={"secondary"}
          sx={{ paddingX: 1.5, paddingY: 1 }}
          onClick={handleClick}
          startIcon={
            pendingTask ? (
              <PendingTaskProgress />
            ) : (
              <DoneAllRounded sx={{ height: 16, width: 16 }} />
            )
          }
        >
          <Truncate sx={{ maxWidth: { sm: 260, xs: 120 } }}>
            {pendingTask ? `${pendingTask.name}` : "Up to date"}
          </Truncate>
        </Button>
      </Tooltip>
      <Menu
        // BackdropProps={{ invisible: false }} FIXME
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          horizontal: "center",
          vertical: "bottom",
        }}
        transformOrigin={{
          horizontal: "center",
          vertical: "top",
        }}
        sx={{
          "& .MuiPopover-paper": {
            maxHeight: 224,
            maxWidth: { sm: 360 },
            width: "100%",
          },
          marginTop: 0.5,
        }}
        MenuListProps={{
          dense: true,
          sx: {
            "& .MuiListItem-root": {
              paddingX: 1,
              paddingY: 0,
            },
            "& .MuiListItemButton-root": {
              // borderRadius: 0.5,
              opacity: "1 !important",
            },
            marginX: -1,
          },
        }}
        slotProps={{
          // backdrop: {
          //   invisible: false,
          // },
          paper: { sx: { overflowY: "scroll" } },
        }}
      >
        {taskQueue
          .slice()
          .reverse()
          .map((task) => (
            <ListItem
              key={task.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="Cancel Task"
                  size="small"
                  color="secondary"
                  onClick={() => cancelTask(task.id)}
                >
                  <CancelOutlined fontSize="inherit" />
                </IconButton>
              }
            >
              <ListItemButton disabled>
                <HourglassEmptyRounded sx={{ marginRight: 1.25, width: 14 }} color="secondary" />
                <ListItemText primary={<Truncate>{task.name}</Truncate>} />
              </ListItemButton>
            </ListItem>
          ))}
        {pendingTask && (
          <ListItem
            secondaryAction={
              pendingTask.abortable ? (
                <IconButton
                  edge="end"
                  aria-label="Cancel Task"
                  size="small"
                  color="secondary"
                  onClick={() => cancelTask(pendingTask.id)}
                >
                  <CancelOutlined fontSize="inherit" />
                </IconButton>
              ) : null
            }
          >
            <ListItemButton
              onClick={() => setSelectedTaskId(pendingTask.id)}
              aria-label="View Task Details"
            >
              <PendingTaskProgress key={pendingTask.id} sx={{ marginRight: 1.25 }} />
              <ListItemText
                primary={
                  <Stack direction="row" gap={0.5}>
                    <Truncate>{pendingTask.name}</Truncate>
                    <Typography fontFamily={MonoFont} variant="inherit" color="text.secondary">
                      (<TaskDuration key={pendingTask.id} task={pendingTask} />)
                    </Typography>
                  </Stack>
                }
              />
            </ListItemButton>
          </ListItem>
        )}
        {taskHistory.map((task) => (
          <ListItem key={task.id}>
            <ListItemButton
              onClick={() => setSelectedTaskId(task.id)}
              aria-label="View Task Details"
            >
              {task.abortController?.signal.aborted ? (
                <Block sx={{ marginRight: 1, width: 16 }} color="secondary" />
              ) : task.errorMessage ? (
                <ClearRounded sx={{ marginRight: 1, width: 16 }} color="error" />
              ) : (
                <CheckRounded sx={{ marginRight: 1, width: 16 }} color="success" />
              )}
              <ListItemText
                primary={
                  <Stack direction="row" gap={0.5}>
                    <Truncate>{task.name}</Truncate>
                    <Typography fontFamily={MonoFont} variant="inherit" color="text.secondary">
                      (<TaskDuration task={task} />)
                    </Typography>
                  </Stack>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
        {taskQueue.length === 0 && taskHistory.length === 0 && !pendingTask && (
          <ListItem>
            <ListItemButton disabled>
              <ListItemText primary="Nothing to see here..." />
            </ListItemButton>
          </ListItem>
        )}
      </Menu>
      {selectedTaskId && (
        <TaskDetailsDialog open onClose={() => setSelectedTaskId(null)} taskId={selectedTaskId} />
      )}
    </>
  )
}
