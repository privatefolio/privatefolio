import { Drawer, DrawerProps, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { enqueueSnackbar } from "notistack"
import {
  BINANCE_WALLET_IDS,
  BINANCE_WALLETS,
  binanceConnExtension,
} from "privatefolio-backend/src/extensions/connections/binance/binance-settings"
import React, { useState } from "react"
import { DrawerHeader } from "src/components/DrawerHeader"
import { ExtensionBlock } from "src/components/ExtensionBlock"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { LoadingButton } from "src/components/LoadingButton"
import { PlatformBlock } from "src/components/PlatformBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TimestampBlock } from "src/components/TimestampBlock"
import { useConfirm } from "src/hooks/useConfirm"
import { BinanceConnectionOptions, Connection } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode, PopoverToggleProps } from "src/stores/app-store"
import { getAddressBookEntry } from "src/stores/metadata-store"
import { formatNumber } from "src/utils/formatting-utils"
import { $rpc } from "src/workers/remotes"

type ConnectionDrawerProps = DrawerProps &
  PopoverToggleProps & {
    connection: Connection
    relativeTime: boolean
  }

export function ConnectionDrawer(props: ConnectionDrawerProps) {
  const { open, toggleOpen, connection, relativeTime, ...rest } = props
  const { id, address, timestamp, syncedAt, extensionId, platformId, meta, apiKey, options } =
    connection

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const confirm = useConfirm()
  const [loadingRemove, setLoadingRemove] = useState(false)
  const [loadingReset, setLoadingReset] = useState(false)
  const [loadingSync, setLoadingSync] = useState(false)
  const [loadingResync, setLoadingResync] = useState(false)

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
        <div>
          <SectionTitle>Platform</SectionTitle>
          <PlatformBlock id={platformId} />
        </div>
        {extensionId === binanceConnExtension ? (
          <div>
            <SectionTitle>API Key</SectionTitle>
            <Stack gap={0.5} alignItems="flex-start">
              <IdentifierBlock id={apiKey as string} />
            </Stack>
          </div>
        ) : (
          <div>
            <SectionTitle>Wallet</SectionTitle>
            <Stack gap={0.5} alignItems="flex-start">
              <IdentifierBlock id={address!} label={getAddressBookEntry(address!)} />
            </Stack>
          </div>
        )}
        <div>
          <SectionTitle>Created</SectionTitle>
          <TimestampBlock timestamp={timestamp} relative={relativeTime} />
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
        <div>
          <SectionTitle>Audit logs</SectionTitle>
          {!meta ? (
            <Typography component="span" variant="inherit">
              0
            </Typography>
          ) : (
            formatNumber(meta.logs)
          )}
        </div>
        <div>
          <SectionTitle>Transactions</SectionTitle>
          {!meta ? (
            <Typography component="span" variant="inherit">
              0
            </Typography>
          ) : (
            formatNumber(meta.transactions)
          )}
        </div>
        {extensionId === binanceConnExtension && (
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
                    .map((x) => BINANCE_WALLETS[x])
                    .join(", ")}
                </Typography>
              </div>
            )}
          </>
        )}
        <div>
          <SectionTitle>Actions</SectionTitle>
          <Stack gap={1} alignItems="flex-start">
            <LoadingButton
              loading={loadingSync}
              loadingText="Syncing connection…"
              tooltip="Sync connection"
              size="small"
              variant="outlined"
              color="secondary"
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
                      enqueueSnackbar("Connection sync failed", { variant: "error" })
                    }
                  }
                )
              }}
            >
              Sync connection
            </LoadingButton>
            <LoadingButton
              loadingText={loadingReset ? "Resetting connection…" : "Resyncing connection…"}
              tooltip="This will reset and re-sync the connection"
              loading={loadingReset || loadingResync}
              size="small"
              variant="outlined"
              color="secondary"
              onClick={async () => {
                setLoadingReset(true)
                await rpc.enqueueResetConnection(activeAccount, "user", connection.id, (error) => {
                  setLoadingReset(false)
                  if (error) {
                    enqueueSnackbar(`Connection reset failed: ${error}`, { variant: "error" })
                  } else {
                    enqueueSnackbar("Connection reset", { variant: "success" })
                  }
                })
                setLoadingResync(true)
                await rpc.enqueueSyncConnection(
                  activeAccount,
                  "user",
                  connection.id,
                  $debugMode.get(),
                  (error) => {
                    setLoadingResync(false)
                    if (error) {
                      enqueueSnackbar(`Connection re-sync failed: ${error}`, {
                        variant: "error",
                      })
                    } else {
                      enqueueSnackbar("Connection re-synced", { variant: "success" })
                    }
                  }
                )
              }}
            >
              Reset connection
            </LoadingButton>
            <LoadingButton
              loading={loadingRemove}
              loadingText="Removing connection…"
              tooltip="This will remove the connection alongside its transactions and audit logs"
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
                await rpc.enqueueDeleteConnection(activeAccount, "user", connection.id, (error) => {
                  setLoadingRemove(false)
                  if (error) {
                    enqueueSnackbar(`Connection removal failed: ${error}`, { variant: "error" })
                  } else {
                    enqueueSnackbar("Connection removed", { variant: "success" })
                    toggleOpen()
                  }
                })
              }}
            >
              Remove connection
            </LoadingButton>
          </Stack>
        </div>
      </Stack>
    </Drawer>
  )
}
