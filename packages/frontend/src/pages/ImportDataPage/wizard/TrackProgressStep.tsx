import { CheckRounded, HourglassEmptyRounded } from "@mui/icons-material"
import { Stack, StackProps, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { CircularSpinner } from "src/components/CircularSpinner"
import { Extension, ServerTask, TaskStatus } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

type TrackProgressStepProps = {
  extension?: Extension
  groupId: string
}

const STATUS_ICON_MAP = {
  0: (
    <Tooltip title="Task queued">
      <HourglassEmptyRounded sx={{ fontSize: 16 }} color="secondary" />
    </Tooltip>
  ),
  1: (
    <Tooltip title="Task running">
      <span>
        <CircularSpinner size={16} color="secondary" />
      </span>
    </Tooltip>
  ),
  2: (
    <Tooltip title="Task completed">
      <CheckRounded sx={{ fontSize: 16 }} color="success" />
    </Tooltip>
  ),
}

const MyStack = (props: StackProps) => (
  <Stack alignItems="center" flexDirection="row" gap={1} {...props} />
)

export function TrackProgressStep(props: TrackProgressStepProps) {
  const { extension, groupId } = props

  const [tasks, setTasks] = useState<ServerTask[]>([])

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    setTasks([])
  }, [groupId])

  const [importStatus, completedAt] = useMemo<[number, number]>(() => {
    const importTasks = tasks.filter((task) => task.trigger === "user")
    if (importTasks.length === 0) return [0, 0]

    const finished = importTasks.every(
      (task) => task.status !== TaskStatus.Running && task.status !== TaskStatus.Queued
    )
    if (finished) {
      const latestImportTask = importTasks.sort(
        (a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)
      )[0]
      return [2, latestImportTask.completedAt ?? 0]
    }

    const running = importTasks.some((task) => task.status === TaskStatus.Running)
    if (running) return [1, 0]

    return [0, 0]
  }, [tasks])

  const computeStatus = useMemo<number>(() => {
    const computeTasks = tasks.filter((task) => task.trigger === "side-effect")

    if (computeTasks.length === 0 && completedAt && Date.now() - completedAt > 2_000) return 2
    if (computeTasks.length === 0) return 0

    const finished = computeTasks.every(
      (task) => task.status !== TaskStatus.Running && task.status !== TaskStatus.Queued
    )
    if (finished) return 2

    const running = computeTasks.some((task) => task.status === TaskStatus.Running)
    if (running) return 1

    return 0
  }, [completedAt, tasks])

  useEffect(() => {
    if (importStatus === 2 && computeStatus === 2) return

    const fetchData = () => {
      rpc
        .getServerTasks(activeAccount, "SELECT * FROM server_tasks WHERE groupId = ?", [groupId])
        .then(setTasks)
    }

    fetchData()

    const interval = setInterval(() => {
      fetchData()
    }, 1000)

    return () => clearInterval(interval)
  }, [groupId, rpc, activeAccount, importStatus, computeStatus])

  if (!extension) return null

  return (
    <>
      {extension.extensionType === "manual-import" && (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Congratulations for adding your first transaction! 🎉
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Checklist:
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            component="div"
            sx={{ marginY: 0.5, paddingLeft: 3 }}
          >
            <MyStack>
              {STATUS_ICON_MAP[2]}
              <span>Add transaction</span>
            </MyStack>
            <MyStack>
              {STATUS_ICON_MAP[computeStatus]}
              <span>Compute portfolio changes (prices, networth, trades etc.)</span>
            </MyStack>
          </Typography>
        </>
      )}
      {extension.extensionType === "file-import" && (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Congratulations for adding your first file import! 🎉
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Checklist:
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            component="div"
            sx={{ marginY: 0.5, paddingLeft: 3 }}
          >
            <MyStack>
              {STATUS_ICON_MAP[2]}
              <span>Upload files</span>
            </MyStack>
            <MyStack>
              {STATUS_ICON_MAP[importStatus]}
              <span>Extract data from files</span>
            </MyStack>
            <MyStack>
              {STATUS_ICON_MAP[computeStatus]}
              <span>Compute portfolio changes (prices, networth, trades etc.)</span>
            </MyStack>
          </Typography>
        </>
      )}
      {extension.extensionType === "connection" && (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Congratulations for adding your first connection! 🎉
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Checklist:
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            component="div"
            sx={{ marginY: 0.5, paddingLeft: 3 }}
          >
            <MyStack>
              {STATUS_ICON_MAP[2]}
              <span>Set up connection</span>
            </MyStack>
            <MyStack>
              {STATUS_ICON_MAP[importStatus]}
              <span>Sync connection & process data</span>
            </MyStack>
            <MyStack>
              {STATUS_ICON_MAP[computeStatus]}
              <span>Compute portfolio changes (prices, networth, trades etc.)</span>
            </MyStack>
          </Typography>
        </>
      )}
    </>
  )
}
