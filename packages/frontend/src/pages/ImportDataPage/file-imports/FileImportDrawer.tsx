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
import React, { MouseEvent, useState } from "react"
import { AmountBlock } from "src/components/AmountBlock"
import { ExtensionBlock } from "src/components/ExtensionBlock"
import { FileSizeBlock } from "src/components/FileSizeBlock"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TimestampBlock } from "src/components/TimestampBlock"
import { useConfirm } from "src/hooks/useConfirm"
import { FileImport } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { PopoverToggleProps } from "src/stores/app-store"
import { $rpc } from "src/workers/remotes"

type FileImportDrawerProps = DrawerProps &
  PopoverToggleProps & {
    fileImport: FileImport
    relativeTime: boolean
  }

export function FileImportDrawer(props: FileImportDrawerProps) {
  const { open, toggleOpen, fileImport, relativeTime, ...rest } = props

  // const activeIndex = useStore($activeIndex)

  const { id, timestamp, meta, name, lastModified, size } = fileImport

  const extensionId = meta?.extensionId
  const parserId = meta?.parserId

  // const [logsNumber, setLogsNumber] = useState<number | null>(null)

  // useEffect(() => {
  //   if (!open) return

  //   $rpc.get().getAuditLogsByTxId($activeAccount.get(), _id).then((logs) => {
  //     setLogsNumber(logs.length)
  //   })
  // }, [_id, open])

  const confirm = useConfirm()
  const [loading, setLoading] = useState(false)

  async function handleRemove(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()

    const { confirmed } = await confirm({
      confirmText: "Remove",
      content: (
        <>
          All audit logs and transactions linked to this file import will be deleted.
          <br /> This action is permanent. Are you sure you wish to continue?
        </>
      ),
      title: "Remove file import",
      variant: "warning",
    })

    if (!confirmed) return

    setLoading(true)
    await $rpc
      .get()
      .enqueueRemoveFileImport($activeAccount.get(), "user", fileImport.id, () => setLoading(false))
  }

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
            File import details
          </Typography>
          <IconButton onClick={toggleOpen} edge="end" color="secondary" aria-label="Close dialog">
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>
        <div>
          <SectionTitle>Identifier</SectionTitle>
          <IdentifierBlock id={id} />
        </div>
        <div>
          <SectionTitle>File</SectionTitle>
          <Stack gap={0.5} alignItems="flex-start">
            <IdentifierBlock id={name} />
            <Typography variant="caption">
              <TimestampBlock timestamp={lastModified} relative={false} hideTime />
              {" • "}
              <FileSizeBlock size={size} />
            </Typography>
          </Stack>
        </div>
        <div>
          <SectionTitle>Parser Id</SectionTitle>
          {!parserId ? (
            <Skeleton height={20} width={80} />
          ) : (
            <IdentifierBlock id={parserId} size="small" />
          )}
        </div>
        <div>
          <SectionTitle>Extension</SectionTitle>
          {!extensionId ? <Skeleton height={20} width={80} /> : <ExtensionBlock id={extensionId} />}
        </div>
        <div>
          <SectionTitle>Platform</SectionTitle>
          {!meta ? <Skeleton height={20} width={80} /> : <PlatformBlock id={meta.platform} />}
        </div>
        <div>
          <SectionTitle>Imported</SectionTitle>
          {timestamp ? (
            <TimestampBlock timestamp={timestamp} relative={relativeTime} />
          ) : (
            <Skeleton height={20} width={80} />
          )}
        </div>
        <div>
          <SectionTitle>Audit logs</SectionTitle>
          {!meta ? <Skeleton height={20} width={80} /> : <AmountBlock amount={meta.logs} />}
        </div>
        <div>
          <SectionTitle>Transactions</SectionTitle>
          {!meta ? <Skeleton height={20} width={80} /> : <AmountBlock amount={meta.transactions} />}
        </div>
        <div>
          <SectionTitle>Actions</SectionTitle>
          <Tooltip
            title={
              loading ? "Removing..." : "This will remove all its transactions and audit logs too"
            }
          >
            <span>
              <LoadingButton
                size="small"
                variant="outlined"
                color="error"
                onClick={handleRemove}
                loading={loading}
              >
                Remove file import
              </LoadingButton>
            </span>
          </Tooltip>
        </div>

        {/* assets */}
        {/* operations */}
        {/* wallets */}
        {/* integration */}

        {/* <pre>{JSON.stringify(txMeta, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(fileImport, null, 2)}</pre> */}
      </Stack>
    </Drawer>
  )
}
