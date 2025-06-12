import { LoadingButton } from "@mui/lab"
import { Drawer, DrawerProps, Stack, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { enqueueSnackbar } from "notistack"
import {
  BINANCE_WALLET_IDS,
  BINANCE_WALLET_LABELS,
} from "privatefolio-backend/src/extensions/connections/binance/binance-settings"
import React, { useState } from "react"
import { AmountBlock } from "src/components/AmountBlock"
import { DrawerHeader } from "src/components/DrawerHeader"
import { ExtensionBlock } from "src/components/ExtensionBlock"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TimestampBlock } from "src/components/TimestampBlock"
import { useConfirm } from "src/hooks/useConfirm"
import { BinanceConnectionOptions, Connection } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode, PopoverToggleProps } from "src/stores/app-store"
import { $rpc } from "src/workers/remotes"

type ConnectionDrawerProps = DrawerProps &
  PopoverToggleProps & {
    connection: Connection
    relativeTime: boolean
  }

export function ConnectionDrawer(props: ConnectionDrawerProps) {
  const { open, toggleOpen, connection, relativeTime, ...rest } = props
  const {
    id,
    address,
    timestamp,
    syncedAt,
    extensionId,
    platform: platformId,
    label,
    meta,
    key,
    options,
  } = connection

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

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
        <DrawerHeader toggleOpen={toggleOpen}>Connection details</DrawerHeader>
        <div>
          <SectionTitle>Identifier</SectionTitle>
          <IdentifierBlock id={id} />
        </div>
        <div>
          <SectionTitle>Extension</SectionTitle>
          <ExtensionBlock id={extensionId} />
        </div>

        {extensionId === "binance-connection" ? (
          <div>
            <SectionTitle>API Key</SectionTitle>
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
          <TimestampBlock timestamp={timestamp} relative={relativeTime} />
        </div>
        <div>
          <SectionTitle>Platform</SectionTitle>
          <PlatformBlock id={platformId} />
        </div>
        <div>
          <SectionTitle>Audit logs</SectionTitle>
          {!meta ? (
            <Typography component="span" variant="inherit">
              0
            </Typography>
          ) : (
            <AmountBlock amount={meta.logs} />
          )}
        </div>
        <div>
          <SectionTitle>Transactions</SectionTitle>
          {!meta ? (
            <Typography component="span" variant="inherit">
              0
            </Typography>
          ) : (
            <AmountBlock amount={meta.transactions} />
          )}
        </div>
        <div>
          <SectionTitle>Synced at</SectionTitle>
          {syncedAt ? (
            <TimestampBlock timestamp={syncedAt} relative={relativeTime} />
          ) : (
            <Typography component="span" variant="inherit">
              Not synced
            </Typography>
          )}
        </div>
        {extensionId === "binance-connection" && (
          <>
            {(options?.sinceLimit || options?.untilLimit) && (
              <div>
                <SectionTitle>Import range</SectionTitle>
                <Stack gap={0.5} alignItems="flex-start">
                  {options?.sinceLimit && (
                    <span>
                      Since -{" "}
                      <TimestampBlock timestamp={options.sinceLimit} relative={relativeTime} />
                    </span>
                  )}
                  {options?.untilLimit && (
                    <span>
                      Until -{" "}
                      <TimestampBlock timestamp={options.untilLimit} relative={relativeTime} />
                    </span>
                  )}
                </Stack>
              </div>
            )}
            {options && (options as BinanceConnectionOptions).wallets && (
              <div>
                <SectionTitle>Wallets</SectionTitle>
                <Typography component="span" variant="inherit">
                  {BINANCE_WALLET_IDS.filter(
                    (x) => (options as BinanceConnectionOptions).wallets[x]
                  )
                    .map((x) => BINANCE_WALLET_LABELS[x])
                    .join(", ")}
                </Typography>
              </div>
            )}
          </>
        )}
        <Stack direction="column" gap={1}>
          <SectionTitle>Actions</SectionTitle>
          <Tooltip title={loadingSync ? "Syncing…" : "Sync connection"}>
            <span>
              <LoadingButton
                size="small"
                variant="outlined"
                color="secondary"
                loading={loadingSync}
                onClick={() => {
                  setLoadingSync(true)
                  rpc.enqueueSyncConnection(
                    activeAccount,
                    "user",
                    connection.id,
                    $debugMode.get(),
                    (error) => {
                      setLoadingSync(false)
                      if (error) {
                        enqueueSnackbar("Could not sync connection", { variant: "error" })
                      }
                    }
                  )
                }}
              >
                Sync connection
              </LoadingButton>
            </span>
          </Tooltip>
          <Tooltip title={loadingReset ? "Resetting…" : "This will reset and sync the connection"}>
            <span>
              <LoadingButton
                size="small"
                variant="outlined"
                color="secondary"
                onClick={async () => {
                  setLoadingReset(true)

                  await rpc.enqueueResetConnection(activeAccount, "user", connection.id)
                  await rpc.enqueueSyncConnection(
                    activeAccount,
                    "user",
                    connection.id,
                    $debugMode.get(),
                    () => setLoadingReset(false)
                  )
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
                ? "Removing…"
                : "This will remove the connection alongside its transactions and audit logs"
            }
          >
            <span>
              <LoadingButton
                size="small"
                variant="outlined"
                color="error"
                onClick={async () => {
                  const { confirmed } = await confirm({
                    confirmText: "Remove",
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
                  await rpc.enqueueDeleteConnection(activeAccount, "user", connection.id, () =>
                    setLoadingRemove(false)
                  )
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
