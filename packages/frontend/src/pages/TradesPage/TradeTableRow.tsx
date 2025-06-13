import { Visibility } from "@mui/icons-material"
import { Chip, IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { formatDistance } from "date-fns"
import React, { useEffect, useState } from "react"
import { ActionBlock } from "src/components/ActionBlock"
import { AmountBlock } from "src/components/AmountBlock"
import { AssetAmountBlock } from "src/components/AssetAmountBlock"
import { MyAssetBlock } from "src/components/MyAssetBlock"
import { TagList } from "src/components/TagList"
import { TimestampBlock } from "src/components/TimestampBlock"
import { useBoolean } from "src/hooks/useBoolean"
import { ChartData, Trade } from "src/interfaces"
import { $showQuotedAmounts } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { TableRowComponentProps } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { TradeDrawer } from "./TradeDrawer"

export function TradeTableRow({
  row,
  headCells,
  isMobile: _isMobile,
  isTablet,
  relativeTime,
}: TableRowComponentProps<Trade>) {
  const {
    createdAt,
    duration,
    tradeStatus: status,
    assetId,
    amount,
    tradeType,
    cost,
    fees,
    profit,
    closedAt,
  } = row

  const { value: open, toggle: toggleOpen } = useBoolean(false)
  const [priceMap, setPriceMap] = useState<Record<string, ChartData>>()
  const showQuotedAmounts = useStore($showQuotedAmounts)

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    if (priceMap) return
    if (!showQuotedAmounts && !open) return

    rpc
      .getAssetPriceMap(activeAccount, status === "closed" ? closedAt : undefined)
      .then((priceMap) => {
        setPriceMap(priceMap)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showQuotedAmounts, createdAt, rpc, activeAccount])

  if (isTablet) {
    return (
      <>
        <TableRow hover tabIndex={-1}>
          <TableCell colSpan={headCells.length}>
            <Typography variant="caption" color="text.secondary">
              <TimestampBlock timestamp={createdAt} relative={relativeTime} />
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Asset:</strong> <MyAssetBlock id={assetId} />
            </Typography>

            <Typography variant="body2">
              <strong>Amount:</strong> {amount}
            </Typography>

            <Typography variant="body2">
              <strong>Direction:</strong> <ActionBlock action={tradeType} />
              <strong>Status:</strong> {status}
            </Typography>

            {duration || status === "open" ? (
              <Typography variant="body2">
                <strong>Duration:</strong>{" "}
                {!duration
                  ? status === "open"
                    ? formatDistance(new Date(createdAt), new Date(), { addSuffix: false })
                    : "N/A"
                  : formatDistance(0, duration, { includeSeconds: true })}
              </Typography>
            ) : null}

            {cost && cost.length > 0 ? (
              <Typography variant="body2">
                <strong>Cost:</strong>{" "}
                {cost.map(([asset, amount]) => `${amount} ${asset.split(":").pop()}`).join(", ")}
              </Typography>
            ) : null}

            {fees && fees.length > 0 ? (
              <Typography variant="body2">
                <strong>Fees:</strong>{" "}
                {fees.map(([asset, amount]) => `${amount} ${asset.split(":").pop()}`).join(", ")}
              </Typography>
            ) : null}

            {profit && profit.length > 0 ? (
              <Typography variant="body2">
                <strong>Profit:</strong>{" "}
                {profit.map(([asset, amount]) => `${amount} ${asset.split(":").pop()}`).join(", ")}
              </Typography>
            ) : null}

            <TagList itemId={row.id} itemType="trade" />

            <Tooltip title="Inspect">
              <IconButton size="small" color="secondary" onClick={toggleOpen} sx={{ mt: 1 }}>
                <Visibility fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
        <TradeDrawer
          key={row.id}
          open={open}
          toggleOpen={toggleOpen}
          trade={row}
          relativeTime={relativeTime}
          priceMap={priceMap}
          anchor="right"
        />
      </>
    )
  }

  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell>
          <TimestampBlock timestamp={createdAt} relative={relativeTime} />
        </TableCell>
        {/* <TableCell>
          {!duration
            ? status === "open"
              ? formatDistance(new Date(createdAt), new Date(), { addSuffix: false })
              : "N/A"
            : formatDistance(0, duration, { includeSeconds: true })}
        </TableCell> */}
        <TableCell>
          <ActionBlock action={tradeType} />
        </TableCell>
        <TableCell variant="clickable" align="right">
          <AssetAmountBlock
            amount={amount}
            assetId={assetId}
            priceMap={priceMap}
            // colorized
            // showSign
          />
        </TableCell>
        <TableCell>
          <MyAssetBlock id={assetId} />
        </TableCell>

        <TableCell>
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {cost && cost.length > 0 ? (
              cost.map(([asset, amount]) => (
                <Chip
                  size="small"
                  key={asset}
                  label={
                    <AssetAmountBlock
                      amount={amount ? `-${amount}` : undefined}
                      assetId={asset}
                      priceMap={priceMap}
                      showTicker
                      showSign
                      colorized
                    />
                  }
                />
              ))
            ) : (
              <AmountBlock placeholder="None" />
            )}
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {fees && fees.length > 0 ? (
              fees.map(([asset, amount]) => (
                <Chip
                  size="small"
                  key={asset}
                  label={
                    <AssetAmountBlock
                      key={asset}
                      amount={amount}
                      assetId={asset}
                      priceMap={priceMap}
                      showTicker
                      showSign
                      colorized
                    />
                  }
                />
              ))
            ) : (
              <AmountBlock placeholder="None" />
            )}
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {profit && profit.length > 0 ? (
              profit.map(([asset, amount]) => (
                <Chip
                  size="small"
                  key={asset}
                  label={
                    <AssetAmountBlock
                      key={asset}
                      amount={amount}
                      assetId={asset}
                      priceMap={priceMap}
                      showTicker
                      showSign
                      colorized
                    />
                  }
                />
              ))
            ) : (
              <AmountBlock placeholder="None" />
            )}
          </Stack>
        </TableCell>
        {/* <TableCell>
          <TagList itemId={row.id} itemType="trade" />
        </TableCell> */}
        <TableCell variant="actionList">
          <Tooltip title="Inspect">
            <IconButton size="small" color="secondary" onClick={toggleOpen}>
              <Visibility fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TradeDrawer
        key={row.id}
        open={open}
        toggleOpen={toggleOpen}
        trade={row}
        relativeTime={relativeTime}
        priceMap={priceMap}
        anchor="right"
      />
    </>
  )
}
