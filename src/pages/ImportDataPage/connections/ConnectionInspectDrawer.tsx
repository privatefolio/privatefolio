import { CloseRounded } from "@mui/icons-material"
import { LoadingButton } from "@mui/lab"
import {
  Drawer,
  DrawerProps,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import React, { useState } from "react"
import { AmountBlock } from "src/components/AmountBlock"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TimestampBlock } from "src/components/TimestampBlock"
import { useConfirm } from "src/hooks/useConfirm"
import { Connection } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { PopoverToggleProps } from "src/stores/app-store"
import { enqueueTask, TaskPriority } from "src/stores/task-store"
import { handleAuditLogChange } from "src/utils/common-tasks"
import { clancy } from "src/workers/remotes"

type ConnectionInspectDrawerProps = DrawerProps &
  PopoverToggleProps & {
    connection: Connection
    relativeTime: boolean
  }

export function ConnectionInspectDrawer(props: ConnectionInspectDrawerProps) {
  const { open, toggleOpen, connection, relativeTime, ...rest } = props
  const { _id, address, timestamp, syncedAt, platform, label, meta, key } = connection
  const confirm = useConfirm()
  const [loadingRemove, setLoadingRemove] = useState(false)
  const [loadingReset, setLoadingReset] = useState(false)
  const [loadingSync, setLoadingSync] = useState(false)

  return (
    <Drawer open={open} onClose={toggleOpen} {...rest}>
      <Stack
        paddingX={2}
        paddingY={1}
        gap={2}
        sx={(theme) => ({ overflowX: "hidden", width: 359, ...theme.typography.body2 })}
      >
        <Stack marginBottom={2} direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" letterSpacing="0.025rem">
            Connection details
          </Typography>
          <IconButton onClick={toggleOpen} edge="end" color="secondary" aria-label="Close dialog">
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>
        <div>
          <SectionTitle>Identifier</SectionTitle>
          <IdentifierBlock id={_id} />
        </div>

        {platform === "binance" ? (
          <div>
            <SectionTitle>Key</SectionTitle>
            <Stack gap={0.5} alignItems="flex-start">
              <IdentifierBlock id={key as string} />
              <Typography variant="caption">{label ? `${label}` : null}</Typography>
            </Stack>
          </div>
        ) : (
          <div>
            <SectionTitle>Address</SectionTitle>
            <Stack gap={0.5} alignItems="flex-start">
              <IdentifierBlock id={address as string} />
              <Typography variant="caption">{label ? `${label}` : null}</Typography>
            </Stack>
          </div>
        )}

        <div>
          <SectionTitle>Created</SectionTitle>
          {timestamp ? (
            <TimestampBlock timestamp={timestamp} relative={relativeTime} />
          ) : (
            <Skeleton height={20} width={80} />
          )}
        </div>
        <div>
          <SectionTitle>Synced at</SectionTitle>
          {syncedAt ? (
            <TimestampBlock timestamp={syncedAt} relative={relativeTime} />
          ) : (
            <Skeleton height={20} width={80} />
          )}
        </div>
        <div>
          <SectionTitle>Platform</SectionTitle>
          {!platform ? <Skeleton height={20} width={80} /> : <PlatformBlock platform={platform} />}
        </div>
        <div>
          <SectionTitle>Audit logs</SectionTitle>
          {!meta ? <Skeleton height={20} width={80} /> : <AmountBlock amount={meta.logs} />}
        </div>
        <div>
          <SectionTitle>Transactions</SectionTitle>
          {!meta ? <Skeleton height={20} width={80} /> : <AmountBlock amount={meta.transactions} />}
        </div>
        <Stack direction="column" gap={1}>
          <SectionTitle>Actions</SectionTitle>
          <Tooltip title={loadingSync ? "Syncing..." : "Sync connection"}>
            <span>
              <LoadingButton
                size="small"
                variant="outlined"
                color="secondary"
                loading={loadingSync}
                onClick={async () => {
                  setLoadingSync(true)
                  enqueueTask({
                    description: `Sync "${connection.address}"`,
                    determinate: true,
                    function: async (progress) => {
                      await clancy.syncConnection(progress, connection, $activeAccount.get())
                      setLoadingSync(false)
                      handleAuditLogChange()
                    },
                    name: "Sync connection",
                    priority: TaskPriority.High,
                  })
                }}
              >
                Sync connection
              </LoadingButton>
            </span>
          </Tooltip>
          <Tooltip title={loadingReset ? "Reseting..." : "This will reset the connection"}>
            <span>
              <LoadingButton
                size="small"
                variant="outlined"
                color="secondary"
                onClick={async () => {
                  setLoadingReset(true)
                  enqueueTask({
                    description: `Reset "${connection.address}"`,
                    determinate: true,
                    function: async (progress) => {
                      await clancy.resetConnection(connection, progress, $activeAccount.get())
                      await clancy.syncConnection(progress, connection, $activeAccount.get(), "0")
                      setLoadingReset(false)
                    },
                    name: `Reset connection`,
                    priority: TaskPriority.High,
                  })
                  handleAuditLogChange()
                }}
                loading={loadingReset}
              >
                Reset connection
              </LoadingButton>
            </span>
          </Tooltip>
          <Tooltip
            title={
              loadingRemove
                ? "Removing..."
                : "This will remove all its transactions and audit logs too"
            }
          >
            <span>
              <LoadingButton
                size="small"
                variant="outlined"
                color="error"
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
                  setLoadingRemove(true)
                  enqueueTask({
                    description: `Remove "${connection.label}", alongside its audit logs and transactions.`,
                    determinate: true,
                    function: async (progress) => {
                      await clancy.removeConnection(connection, progress, $activeAccount.get())
                      setLoadingRemove(false)
                      handleAuditLogChange()
                    },
                    name: `Remove connection`,
                    priority: TaskPriority.High,
                  })
                }}
                loading={loadingRemove}
              >
                Remove connection
              </LoadingButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Drawer>
  )
}
