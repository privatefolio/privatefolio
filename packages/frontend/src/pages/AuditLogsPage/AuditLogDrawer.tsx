import { Drawer, DrawerProps, Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { ActionBlock } from "src/components/ActionBlock"
import { AmountBlock } from "src/components/AmountBlock"
import { AssetBlock } from "src/components/AssetBlock"
import { DrawerHeader } from "src/components/DrawerHeader"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TagManager } from "src/components/TagManager"
import { TimestampBlock } from "src/components/TimestampBlock"
import { ValueChip } from "src/components/ValueChip"
import { AuditLog, ChartData, Tag } from "src/interfaces"
import { $activeAccount, $activeAccountPath } from "src/stores/account-store"
import { PopoverToggleProps } from "src/stores/app-store"
import { getAddressBookEntry } from "src/stores/metadata-store"
import { getAssetTicker } from "src/utils/assets-utils"
import { $rpc } from "src/workers/remotes"

type AuditLogDrawerProps = DrawerProps &
  PopoverToggleProps & {
    auditLog: AuditLog
    priceMap?: Record<string, ChartData>
    relativeTime: boolean
  }

export function AuditLogDrawer(props: AuditLogDrawerProps) {
  const { open, toggleOpen, auditLog, relativeTime, priceMap, ...rest } = props

  const {
    assetId,
    change,
    balance,
    operation,
    timestamp,
    platformId,
    wallet,
    id,
    txId,
    fileImportId: _importId,
    importIndex: _importIndex,
    // ...extra
  } = auditLog

  const activeAccountPath = useStore($activeAccountPath)
  const [tags, setTags] = useState<Tag[]>([])
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    if (!open) return

    rpc.getTagsForAuditLog(activeAccount, id).then(setTags)
  }, [id, open, timestamp, rpc, activeAccount])

  return (
    <Drawer open={open} onClose={toggleOpen} {...rest}>
      <Stack
        // config={SPRING_CONFIGS.ultra}
        paddingX={2}
        paddingY={1}
        gap={2}
        // show={open}
        sx={(theme) => ({
          maxWidth: 358,
          minWidth: 358,
          overflowX: "hidden",
          ...theme.typography.body2,
        })}
      >
        <DrawerHeader toggleOpen={toggleOpen}>Audit log details</DrawerHeader>
        <div>
          <SectionTitle>Identifier</SectionTitle>
          <IdentifierBlock id={id} />
        </div>
        <div>
          <SectionTitle>Timestamp</SectionTitle>
          <TimestampBlock timestamp={timestamp} relative={relativeTime} />
        </div>
        <div>
          <SectionTitle>Platform</SectionTitle>
          <PlatformBlock id={platformId} />
        </div>
        <div>
          <SectionTitle>Wallet</SectionTitle>
          <IdentifierBlock id={wallet} label={getAddressBookEntry(wallet)} />
        </div>
        <div>
          <SectionTitle>Operation</SectionTitle>
          <ActionBlock action={operation} />
        </div>
        <div>
          <SectionTitle>Change</SectionTitle>
          <Stack direction="row" alignItems="center" gap={0.25}>
            <AmountBlock
              colorized
              amount={change}
              showSign
              currencyTicker={getAssetTicker(assetId)}
            />
            <AssetBlock id={assetId} variant="button" />
            <ValueChip
              value={
                priceMap && change && priceMap[assetId]?.value
                  ? priceMap[assetId].value * Number(change)
                  : undefined
              }
            />
          </Stack>
        </div>
        <div>
          <SectionTitle>New balance</SectionTitle>
          <Stack direction="row" alignItems="center" gap={0.25}>
            <AmountBlock amount={balance} currencyTicker={getAssetTicker(assetId)} />
            <AssetBlock id={assetId} variant="button" />
            <ValueChip
              value={
                priceMap && balance && priceMap[assetId]?.value
                  ? priceMap[assetId].value * Number(balance)
                  : undefined
              }
            />
          </Stack>
        </div>
        <div>
          <SectionTitle>Tags</SectionTitle>
          <TagManager tags={tags} setTags={setTags} itemId={id} itemType="auditLog" />
        </div>
        {txId && (
          <div>
            <SectionTitle>Transaction Id</SectionTitle>
            <IdentifierBlock
              id={txId}
              href={`${activeAccountPath}/transactions?id=${txId}`}
              linkText="See transaction"
            />
          </div>
        )}
        {/* <pre>{JSON.stringify(extra, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(auditLog, null, 2)}</pre> */}
      </Stack>
    </Drawer>
  )
}
