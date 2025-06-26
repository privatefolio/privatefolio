import { SwapHoriz, Visibility } from "@mui/icons-material"
import { IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
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
import { $rpc } from "src/workers/remotes"

import { TimestampBlock } from "../../components/TimestampBlock"
import { ChartData, Transaction } from "../../interfaces"
import { TableRowComponentProps } from "../../utils/table-utils"
import { TransactionDrawer } from "./TransactionDrawer"

export function TransactionTableRow(props: TableRowComponentProps<Transaction>) {
  const { row, relativeTime, headCells, isMobile: _isMobile, isTablet, ...rest } = props

  const {
    incoming,
    incomingAsset,
    type,
    timestamp,
    platformId,
    wallet,
    outgoing,
    outgoingAsset,
    fee,
    feeAsset,
    id,
  } = row

  const { value: open, toggle: toggleOpen } = useBoolean(false)

  const [priceMap, setPriceMap] = useState<Record<string, ChartData>>()

  const showQuotedAmounts = useStore($showQuotedAmounts)

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    if (priceMap) return
    if (!showQuotedAmounts && !open) return

    rpc.getAssetPriceMap(activeAccount, timestamp).then((priceMap) => {
      setPriceMap(priceMap)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showQuotedAmounts, timestamp, rpc, activeAccount])

  if (isTablet) {
    return (
      <>
        <TableRow hover>
          <TableCell colSpan={headCells.length} onClick={toggleOpen} variant="clickable">
            <Stack gap={0.5} marginY={0.5}>
              <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between">
                <ActionBlock action={type} />
                <Typography variant="caption" color="text.secondary">
                  <TimestampBlock timestamp={timestamp} relative={relativeTime} />
                </Typography>
              </Stack>
              <Stack
                direction="row"
                gap={1}
                marginY={0.5}
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
              >
                <Stack spacing={0.5} alignItems="flex-start">
                  <Stack
                    direction="row"
                    gap={1}
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    // flexGrow={outgoing && incoming ? 1 : 0}
                  >
                    {outgoing && (
                      <Stack direction="row" gap={1} alignItems="center">
                        <AssetAmountBlock
                          assetId={outgoingAsset}
                          amount={outgoing ? `-${outgoing}` : undefined}
                          priceMap={priceMap}
                          colorized
                          showSign
                          placeholder=""
                        />
                        <AssetBlock
                          id={outgoingAsset}
                          variant="tablecell"
                          hideTooltip
                          href={undefined}
                        />
                      </Stack>
                    )}
                    {outgoing && incoming ? (
                      <SwapHoriz fontSize="small" color="secondary" sx={{ marginX: 2 }} />
                    ) : null}
                    {incoming && (
                      <Stack direction="row" gap={1} alignItems="center">
                        <AssetAmountBlock
                          assetId={incomingAsset}
                          amount={incoming}
                          priceMap={priceMap}
                          colorized
                          showSign
                          placeholder=""
                        />
                        <AssetBlock
                          id={incomingAsset}
                          variant="tablecell"
                          hideTooltip
                          href={undefined}
                        />
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              </Stack>
              <TagList itemId={id} itemType="transaction" />
            </Stack>
          </TableCell>
        </TableRow>
        <TransactionDrawer
          key={row.id}
          open={open}
          toggleOpen={toggleOpen}
          tx={row}
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
          <PlatformBlock id={platformId} hideName />
        </TableCell>
        <TableCell variant="clickable">
          <IdentifierBlock id={wallet} variant="tablecell" label={getAddressBookEntry(wallet)} />
        </TableCell>
        <TableCell>
          <ActionBlock action={type} />
        </TableCell>
        <TableCell align="right" variant="clickable">
          <AssetAmountBlock
            assetId={outgoingAsset}
            amount={outgoing ? `-${outgoing}` : undefined}
            priceMap={priceMap}
            colorized
            showSign
            placeholder=""
          />
        </TableCell>
        <TableCell variant="clickable">
          <AssetBlock id={outgoingAsset} variant="tablecell" />
        </TableCell>
        <TableCell align="right" variant="clickable">
          <AssetAmountBlock
            assetId={incomingAsset}
            amount={incoming}
            priceMap={priceMap}
            colorized
            showSign
            placeholder=""
          />
        </TableCell>
        <TableCell variant="clickable">
          <AssetBlock id={incomingAsset} variant="tablecell" />
        </TableCell>
        <TableCell align="right" variant="clickable">
          <AssetAmountBlock
            assetId={feeAsset}
            amount={fee}
            priceMap={priceMap}
            colorized
            showSign
            placeholder=""
          />
        </TableCell>
        <TableCell variant="clickable">
          <AssetBlock id={feeAsset} variant="tablecell" />
        </TableCell>
        <TableCell>
          <TagList itemId={id} itemType="transaction" />
        </TableCell>
        <TableCell variant="actionList">
          <Tooltip title="Inspect">
            <IconButton size="small" color="secondary" onClick={toggleOpen}>
              <Visibility fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TransactionDrawer
        key={row.id}
        open={open}
        toggleOpen={toggleOpen}
        tx={row}
        relativeTime={relativeTime}
        priceMap={priceMap}
      />
    </>
  )
}
