import { Visibility } from "@mui/icons-material"
import {
  IconButton,
  Skeleton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material"
import React from "react"
import { PlatformBlock } from "src/components/PlatformBlock"
import { TimestampBlock } from "src/components/TimestampBlock"
import { Truncate } from "src/components/Truncate"
import { useBoolean } from "src/hooks/useBoolean"
import { Connection } from "src/interfaces"
import { MonoFont } from "src/theme"
import { formatNumber } from "src/utils/formatting-utils"
import { TableRowComponentProps } from "src/utils/table-utils"

import { ConnectionInspectDrawer } from "./ConnectionInspectDrawer"

export function ConnectionTableRow(props: TableRowComponentProps<Connection>) {
  const { row, relativeTime, headCells, isMobile: _isMobile, isTablet, ...rest } = props
  const { address, timestamp, syncedAt, platform, label, meta } = row
  const { value: open, toggle: toggleOpen } = useBoolean(false)

  if (isTablet) {
    return (
      <>
        <TableRow hover {...rest}>
          <TableCell colSpan={headCells.length} onClick={toggleOpen} sx={{ cursor: "pointer" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack gap={0.5} marginY={0.5}>
                <Stack direction="row" gap={1} alignItems="center" component="div">
                  {platform ? (
                    <PlatformBlock platform={platform} hideName />
                  ) : (
                    <Skeleton height={20} width={80} />
                  )}
                  <Tooltip title={address}>
                    <Truncate sx={{ fontFamily: MonoFont, maxWidth: 200 }}>{address}</Truncate>
                  </Tooltip>
                </Stack>
                <Stack
                  direction="row"
                  gap={1}
                  alignItems="center"
                  component="div"
                  sx={{ color: "text.secondary", fontSize: "0.75rem" }}
                >
                  {timestamp ? (
                    <TimestampBlock timestamp={timestamp} relative={relativeTime} />
                  ) : (
                    <Skeleton height={20} width={80} />
                  )}
                  {" • "}
                  {!syncedAt ? (
                    <Typography color="text.secondary" component="span" variant="inherit">
                      Not synced
                    </Typography>
                  ) : (
                    <span>
                      <span>Synced</span>{" "}
                      <TimestampBlock timestamp={syncedAt} relative={relativeTime} />
                    </span>
                  )}
                </Stack>
              </Stack>
              <Stack gap={0.5} alignItems={"flex-end"} sx={{ fontSize: "0.75rem" }}>
                {!meta ? (
                  <Skeleton height={20} width={80} />
                ) : (
                  <span>{formatNumber(meta.logs)} audit logs</span>
                )}
                {!meta ? (
                  <Skeleton height={20} width={80} />
                ) : (
                  <span>{formatNumber(meta.transactions)} txns</span>
                )}
              </Stack>
            </Stack>
          </TableCell>
        </TableRow>
        <ConnectionInspectDrawer
          key={row._id}
          open={open}
          toggleOpen={toggleOpen}
          connection={row}
          relativeTime={relativeTime}
        />
      </>
    )
  }

  return (
    <>
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
        <TableCell sx={{ maxWidth: 420, minWidth: 300, width: 420 }}>
          <Stack spacing={1} direction="row" sx={{ fontFamily: MonoFont }}>
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
                title={`${formatNumber(
                  meta.transactions
                )} transactions extracted from ${formatNumber(meta.rows)} entries`}
              >
                <span>{formatNumber(meta.transactions)}</span>
              </Tooltip>
            </>
          )}
        </TableCell>
        <TableCell>
          <Tooltip title="Inspect">
            <IconButton
              size="small"
              color="secondary"
              sx={{
                ".MuiTableRow-root:hover &": {
                  visibility: "visible",
                },
                height: 28,
                marginLeft: -1,
                marginY: -0.25,
                visibility: "hidden",
              }}
              onClick={toggleOpen}
            >
              <Visibility fontSize="inherit" />
            </IconButton>
          </Tooltip>
          {/* <IconButton
          size="small"
          color="secondary"
          onClick={handleClick}
          sx={{
            // ".MuiTableRow-root:hover &": {
            //   visibility: "visible",
            // },
            height: 28,
            marginLeft: -1,
            marginY: -0.5,
            // visibility: "hidden",
          }}
        >
          <MoreHoriz fontSize="inherit" />
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
        </Menu> */}
        </TableCell>
      </TableRow>
      <ConnectionInspectDrawer
        key={row._id}
        open={open}
        toggleOpen={toggleOpen}
        connection={row}
        relativeTime={relativeTime}
      />
    </>
  )
}
