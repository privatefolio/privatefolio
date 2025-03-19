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
    platform,
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
  }, [open, showQuotedAmounts, timestamp])

  if (isTablet) {
    return (
      <>
        <TableRow hover>
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
                flexWrap="wrap"
              >
                <Stack spacing={0.5}>
                  <ActionBlock action={type} />
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
                        <AssetBlock assetId={outgoingAsset} />
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
                        <AssetBlock assetId={incomingAsset} />
                      </Stack>
                    )}
                  </Stack>
                </Stack>
                <TagList itemId={id} itemType="transaction"  />
              </Stack>
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
          <PlatformBlock platform={platform} hideName />
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
        <TableCell>
          <AssetBlock assetId={outgoingAsset} />
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
        <TableCell>
          <AssetBlock assetId={incomingAsset} />
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
        <TableCell>
          <AssetBlock assetId={feeAsset} />
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
