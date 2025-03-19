import { AddRounded, RemoveRounded, Visibility } from "@mui/icons-material"
import { IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { memo, useEffect, useState } from "react"
import { ActionBlock } from "src/components/ActionBlock"
import { AssetAmountBlock } from "src/components/AssetAmountBlock"
import { AssetBlock } from "src/components/AssetBlock"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { TagList } from "src/components/TagList"
import { useBoolean } from "src/hooks/useBoolean"
import { $showQuotedAmounts } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { getAddressBookEntry } from "src/stores/metadata-store"
import { greenColor, redColor } from "src/utils/color-utils"
import { $rpc } from "src/workers/remotes"

import { TimestampBlock } from "../../components/TimestampBlock"
import { AuditLog, ChartData } from "../../interfaces"
import { TableRowComponentProps } from "../../utils/table-utils"
import { AuditLogDrawer } from "./AuditLogDrawer"

function AuditLogTableRowBase(props: TableRowComponentProps<AuditLog>) {
  const { row, relativeTime, headCells, isMobile: _isMobile, isTablet, ...rest } = props
  const { assetId, change, balance, operation, timestamp, platform, wallet, id } = row

  const changeN = Number(change)
  const changeColor = changeN < 0 ? redColor : greenColor

  const showAssetColumn = !headCells.find((cell) => cell.key === "assetId")?.hidden

  const { value: open, toggle: toggleOpen } = useBoolean(false)

  const [priceMap, setPriceMap] = useState<Record<string, ChartData>>()

  const showQuotedAmounts = useStore($showQuotedAmounts)

  useEffect(() => {
    if (priceMap) return
    if (!showQuotedAmounts && !open) return

    $rpc
      .get()
      .getAssetPriceMap($activeAccount.get(), timestamp)
      .then((priceMap) => {
        setPriceMap(priceMap)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, timestamp, showQuotedAmounts])

  if (isTablet) {
    return (
      <>
        <TableRow hover {...rest}>
          <TableCell colSpan={headCells.length} onClick={toggleOpen} sx={{ cursor: "pointer" }}>
            <Stack>
              <Typography variant="caption" color="text.secondary">
                <TimestampBlock timestamp={timestamp} relative={relativeTime} />
              </Typography>
              <Stack
                direction="row"
                gap={1}
                marginY={0.5}
                justifyContent="space-between"
                alignItems="center"
              >
                {operation === "Funding Fee" ? (
                  <ActionBlock
                    action={operation}
                    color={changeColor}
                    size="medium"
                    IconComponent={changeN < 0 ? RemoveRounded : AddRounded}
                  />
                ) : (
                  <ActionBlock action={operation} />
                )}
                <Stack direction="row" gap={1} alignItems="center">
                  <AssetAmountBlock
                    assetId={assetId}
                    amount={change}
                    priceMap={priceMap}
                    colorized
                    showSign
                    showTicker={!showAssetColumn}
                  />
                  {showAssetColumn && <AssetBlock assetId={assetId} />}
                </Stack>
              </Stack>
              <TagList itemId={id} itemType="auditLog" />
            </Stack>
          </TableCell>
        </TableRow>
        <AuditLogDrawer
          key={row.id}
          open={open}
          toggleOpen={toggleOpen}
          auditLog={row}
          relativeTime={relativeTime}
          priceMap={priceMap}
        />
      </>
    )
  }

  return (
    <>
      <TableRow hover {...rest}>
        <TableCell>
          <TimestampBlock timestamp={timestamp} relative={relativeTime} />
        </TableCell>
        <TableCell>
          <PlatformBlock platform={platform} hideName />
        </TableCell>
        <TableCell variant="clickable">
          <IdentifierBlock id={wallet} variant="tablecell" label={getAddressBookEntry(wallet)} />
        </TableCell>
        <TableCell>
          {operation === "Funding Fee" ? (
            <ActionBlock
              action={operation}
              color={changeColor}
              IconComponent={changeN < 0 ? RemoveRounded : AddRounded}
            />
          ) : (
            <ActionBlock action={operation} />
          )}
        </TableCell>
        <TableCell align="right" variant="clickable">
          <AssetAmountBlock
            assetId={assetId}
            amount={change}
            priceMap={priceMap}
            colorized
            showSign
            showTicker={!showAssetColumn}
          />
        </TableCell>
        {showAssetColumn && (
          <TableCell>
            <AssetBlock assetId={assetId} />
          </TableCell>
        )}
        <TableCell align="right">
          <AssetAmountBlock
            assetId={assetId}
            amount={balance}
            priceMap={priceMap}
            tooltipMessage="Use the 'Compute balances' action to compute these values."
          />
        </TableCell>
        <TableCell>
          <TagList itemId={id} itemType="auditLog" />
        </TableCell>
        <TableCell variant="actionList">
          <Tooltip title="Inspect">
            <IconButton size="small" color="secondary" onClick={toggleOpen}>
              <Visibility fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <AuditLogDrawer
        key={row.id}
        open={open}
        toggleOpen={toggleOpen}
        auditLog={row}
        relativeTime={relativeTime}
        priceMap={priceMap}
      />
    </>
  )
}

export const AuditLogTableRow = memo(AuditLogTableRowBase)
