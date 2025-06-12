import { CancelOutlined, DoneAllRounded } from "@mui/icons-material"
import {
  Button,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ServerTask } from "src/interfaces"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $activeAccountPath, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { $rpc } from "src/workers/remotes"

import { MonoFont } from "../../theme"
import { Truncate } from "../Truncate"
import { CircularProgressConnected } from "./CircularProgressConnected"
import { TaskDetailsDialog } from "./TaskDetailsDialog"
import { TaskDuration } from "./TaskDuration"
import { TaskStatusIcon } from "./TaskStatusIcon"

export const LIMIT = 10

export function TaskDropdown() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const [latestTasks, setLatestTasks] = useState<ServerTask[]>([])
  const [selectedTask, setSelectedTask] = useState<ServerTask | null>(null)
  const selectedTaskRef = useRef<ServerTask | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  const accountName = useStore($activeAccount)
  const activeAccountPath = useStore($activeAccountPath)
  const rpc = useStore($rpc)

  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)

  useEffect(() => {
    // TODO2 add filters: all, user, cron, side-effect
    // WHERE trigger = 'user'
    rpc
      .getServerTasks(accountName, `SELECT * FROM server_tasks ORDER BY id DESC LIMIT ${LIMIT}`)
      .then(setLatestTasks)
      .catch(console.error)
  }, [rpc, refresh, accountName, connectionStatus])

  useEffect(() => {
    const subscription = rpc.subscribeToServerTasks(
      accountName,
      throttle(
        () => {
          setRefresh(Math.random())
          if (selectedTaskRef.current) {
            rpc.getServerTask(accountName, selectedTaskRef.current.id).then(setSelectedTask)
          }
        },
        SHORT_THROTTLE_DURATION,
        {
          leading: false,
          trailing: true,
        }
      )
    )

    return closeSubscription(subscription, rpc)
  }, [rpc, accountName, connectionStatus])

  const pendingTask = useMemo(
    () => latestTasks.find((task) => task.status === "running"),
    [latestTasks]
  )

  return (
    <>
      <Tooltip title="Server tasks">
        <Button
          size="small"
          variant="outlined"
          color={"secondary"}
          sx={{ paddingX: 1.5, paddingY: 1 }}
          onClick={handleClick}
          startIcon={
            pendingTask ? (
              <CircularProgressConnected
                task={pendingTask}
                key={pendingTask.id} // important
              />
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
          "& .MuiListItem-root": {
            paddingRight: 1,
          },
          "& .MuiPopover-paper": {
            maxHeight: 226,
            maxWidth: { sm: 360 },
            overflowY: "scroll",
            width: "100%",
          },
          marginTop: 0.5,
        }}
        MenuListProps={{ dense: true }}
      >
        {latestTasks.slice(0, 15).map((task) => (
          <ListItem
            key={task.id}
            secondaryAction={
              (task.status === "running" || task.status === "queued") && (
                <IconButton
                  edge="end"
                  aria-label="Cancel Task"
                  size="small"
                  color="secondary"
                  onClick={() => rpc.cancelTask(accountName, task.id)}
                >
                  <CancelOutlined fontSize="inherit" />
                </IconButton>
              )
            }
          >
            <ListItemButton
              disabled={task.status === "queued"}
              sx={{ opacity: "1 !important" }}
              onClick={() => {
                setSelectedTask(task)
                selectedTaskRef.current = task
              }}
              aria-label="View Task Details"
            >
              <ListItemAvatar>
                <TaskStatusIcon task={task} />
              </ListItemAvatar>
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
        {latestTasks.length === 0 && (
          <ListItem>
            <ListItemButton disabled sx={{ opacity: "1 !important" }}>
              <ListItemText primary="Nothing to see here…" />
            </ListItemButton>
          </ListItem>
        )}
        {latestTasks.length >= LIMIT && (
          <ListItem>
            <ListItemButton
              component={Link}
              to={`${activeAccountPath}/server?tab=tasks`}
              onClick={handleClose}
            >
              <ListItemText primary="See all…" />
            </ListItemButton>
          </ListItem>
        )}
      </Menu>
      {selectedTask && (
        <TaskDetailsDialog
          open
          onClose={() => {
            setSelectedTask(null)
            selectedTaskRef.current = null
          }}
          task={selectedTask}
        />
      )}
    </>
  )
}
