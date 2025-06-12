import { CancelOutlined, Visibility } from "@mui/icons-material"
import { IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { TaskDetailsDialog } from "src/components/Tasks/TaskDetailsDialog"
import { TaskDuration } from "src/components/Tasks/TaskDuration"
import { TaskStatusIcon } from "src/components/Tasks/TaskStatusIcon"
import { TimestampBlock } from "src/components/TimestampBlock"
import { Truncate } from "src/components/Truncate"
import { useBoolean } from "src/hooks/useBoolean"
import { ServerTask, TaskPriority } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { MonoFont } from "src/theme"
import { TableRowComponentProps } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

export function ServerTaskTableRow(props: TableRowComponentProps<ServerTask>) {
  const {
    row,
    relativeTime,
    headCells: _headCells,
    isMobile: _isMobile,
    isTablet: _isTablet,
    ...rest
  } = props

  const { description, id, name, priority, createdAt, trigger, status } = row

  const { value: open, toggle: toggleOpen } = useBoolean(false)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  return (
    <>
      <TableRow hover {...rest}>
        <TableCell>
          <Typography variant="inherit" fontFamily={MonoFont}>
            {id}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="inherit">
            <TimestampBlock timestamp={createdAt} relative={relativeTime} />
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="inherit" component="div">
            <Truncate>{name}</Truncate>
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="inherit" component="div">
            <Truncate>{description}</Truncate>
          </Typography>
        </TableCell>
        <TableCell>
          <Typography
            variant="inherit"
            component="div"
            sx={{ textTransform: "capitalize" }}
            fontFamily={MonoFont}
          >
            {trigger}
          </Typography>
        </TableCell>
        <TableCell>
          {/* <Rating
            name="read-only"
            value={priority}
            max={9}
            // precision={0.5}
            readOnly
            size="small"
            icon={<FiberManualRecord fontSize="inherit" />}
            color="success"
            emptyIcon={<FiberManualRecord fontSize="inherit" />}
            sx={{
              "& .MuiRating-iconEmpty": {
                // color: "var(--mui-palette-secondary-main)",
              },
              "& .MuiRating-iconFilled": {
                color: "var(--mui-palette-primary-main)",
              },
            }}
          /> */}
          <Typography variant="inherit" fontFamily={MonoFont}>
            {TaskPriority[priority]}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography color="text.primary" component="span" variant="inherit" fontFamily={MonoFont}>
            {status !== "queued" ? <TaskDuration task={row} /> : "Queued"}
          </Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" alignItems="center" gap={1}>
            <TaskStatusIcon task={row} />
            <Typography component="span" variant="inherit" sx={{ textTransform: "capitalize" }}>
              {status}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell variant="actionList">
          <Stack direction="row" alignItems="center" justifyContent="flex-end">
            {(status === "queued" || status === "running") && (
              <Tooltip title={status === "queued" ? "Cancel" : "Abort"}>
                <IconButton
                  aria-label="Cancel Task"
                  size="small"
                  color="secondary"
                  onClick={() => rpc.cancelTask(activeAccount, id)}
                >
                  <CancelOutlined fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
            {status !== "queued" && (
              <Tooltip title="Inspect">
                <IconButton size="small" color="secondary" onClick={toggleOpen}>
                  <Visibility fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </TableCell>
      </TableRow>
      {open && <TaskDetailsDialog open onClose={toggleOpen} task={row} />}
    </>
  )
}
