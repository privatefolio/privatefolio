import { HighlightOffRounded, MoreHoriz, RestartAltRounded, SyncRounded } from "@mui/icons-material"
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material"
import React, { useState } from "react"
import { PlatformBlock } from "src/components/PlatformBlock"
import { TimestampBlock } from "src/components/TimestampBlock"
import { Truncate } from "src/components/Truncate"
import { useConfirm } from "src/hooks/useConfirm"
import { Connection } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { enqueueTask, TaskPriority } from "src/stores/task-store"
import { MonoFont } from "src/theme"
import { enqueueSyncConnection, handleAuditLogChange } from "src/utils/common-tasks"
import { formatNumber } from "src/utils/formatting-utils"
import { TableRowComponentProps } from "src/utils/table-utils"
import { clancy } from "src/workers/remotes"

export function ConnectionTableRow(props: TableRowComponentProps<Connection>) {
  const {
    row,
    relativeTime,
    headCells: _headCells,
    isMobile: _isMobile,
    isTablet: _isTablet,
    ...rest
  } = props
  const { address, timestamp, syncedAt, platform, label, meta } = row

  const confirm = useConfirm()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <TableRow hover {...rest}>
      <TableCell sx={{ maxWidth: 180, minWidth: 180, width: 180 }}>
        <TimestampBlock timestamp={timestamp} relative={relativeTime} />
      </TableCell>
      <TableCell sx={{ maxWidth: 180, minWidth: 180, width: 180 }}>
        {!syncedAt ? (
          <Typography color="text.secondary" component="span" variant="inherit">
            Not synced
          </Typography>
        ) : (
          <TimestampBlock timestamp={syncedAt} relative={relativeTime} />
        )}
      </TableCell>
      <TableCell sx={{ fontFamily: MonoFont, maxWidth: 420, minWidth: 300, width: 420 }}>
        <Stack spacing={1} direction="row">
          {platform ? <PlatformBlock platform={platform} hideName /> : <Skeleton></Skeleton>}
          <Tooltip title={address}>
            <Truncate>{address}</Truncate>
          </Tooltip>
          <Typography color="text.secondary" component="span" variant="inherit">
            {" "}
            {label}
          </Typography>
        </Stack>
      </TableCell>
      {/* <TableCell sx={{ fontFamily: MonoFont, maxWidth: 400, minWidth: 400, width: 400 }}>
        <Tooltip title={address}>
          <Truncate>{address}</Truncate>
        </Tooltip>
      </TableCell> */}
      {/* <TableCell sx={{ maxWidth: 180, minWidth: 180, width: 180 }}>
        <TimestampCell timestamp={lastModified} relative={relativeTime} />
      </TableCell> */}
      <TableCell
        sx={{ fontFamily: MonoFont, maxWidth: 128, minWidth: 128, width: 128 }}
        align="right"
      >
        {!meta ? (
          <Skeleton></Skeleton>
        ) : (
          <>
            {meta.logs === meta.rows ? (
              <span>{formatNumber(meta.logs)}</span>
            ) : (
              <Tooltip
                title={`${formatNumber(meta.logs)} audit logs extracted from ${formatNumber(
                  meta.rows
                )} entries`}
              >
                <span>{formatNumber(meta.logs)}</span>
              </Tooltip>
            )}
          </>
        )}
      </TableCell>
      <TableCell
        sx={{ fontFamily: MonoFont, maxWidth: 120, minWidth: 120, width: 120 }}
        align="right"
      >
        {!meta ? (
          <Skeleton></Skeleton>
        ) : (
          <>
            <Tooltip
              title={`${formatNumber(meta.transactions)} transactions extracted from ${formatNumber(
                meta.rows
              )} entries`}
            >
              <span>{formatNumber(meta.transactions)}</span>
            </Tooltip>
          </>
        )}
      </TableCell>
      <TableCell sx={{ maxWidth: 80, minWidth: 80, width: 80 }} align="right">
        <IconButton
          color="secondary"
          onClick={handleClick}
          sx={{ marginRight: -0.5, marginY: -0.5 }}
        >
          <MoreHoriz fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
        >
          <MenuItem
            dense
            onClick={async () => {
              enqueueSyncConnection(row)
              handleAuditLogChange()
              handleClose()
            }}
          >
            <ListItemIcon>
              <SyncRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sync connection</ListItemText>
          </MenuItem>
          <MenuItem
            dense
            onClick={async () => {
              enqueueTask({
                description: `Reset "${row.address}"`,
                determinate: true,
                function: async (progress) => {
                  await clancy.resetConnection(row, progress, $activeAccount.get())
                  await clancy.syncConnection(progress, row, $activeAccount.get(), "0")
                },
                name: `Reset connection`,
                priority: TaskPriority.High,
              })
              handleAuditLogChange()
              handleClose()
            }}
          >
            <ListItemIcon>
              <RestartAltRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reset connection</ListItemText>
          </MenuItem>
          <MenuItem
            dense
            onClick={async () => {
              const { confirmed } = await confirm({
                content: (
                  <>
                    All audit logs and transactions linked to this connection will be deleted.
                    <br /> This action is permanent. Are you sure you wish to continue?
                  </>
                ),
                title: "Remove connection",
                variant: "warning",
              })

              if (!confirmed) return

              enqueueTask({
                description: `Remove "${row.label}", alongside its audit logs and transactions.`,
                determinate: true,
                function: async (progress) => {
                  await clancy.removeConnection(row, progress, $activeAccount.get())
                },
                name: `Remove connection`,
                priority: TaskPriority.High,
              })
              handleAuditLogChange()
              handleClose()
            }}
          >
            <ListItemIcon>
              <HighlightOffRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText>Remove connection</ListItemText>
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  )
}
