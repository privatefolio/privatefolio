import { Visibility } from "@mui/icons-material"
import { IconButton, TableCell, TableRow, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { formatDistance } from "date-fns"
import React, { useEffect, useState } from "react"
import { AmountBlock } from "src/components/AmountBlock"
import { AssetBlock } from "src/components/AssetBlock"
import { TagList } from "src/components/TagList"
import { TimestampBlock } from "src/components/TimestampBlock"
import { useBoolean } from "src/hooks/useBoolean"
import { ChartData, Trade } from "src/interfaces"
import { $showQuotedAmounts } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { getAssetTicker } from "src/utils/assets-utils"
import { TableRowComponentProps } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { TradeDrawer } from "./TradeDrawer"

export function TradeTableRow({
  row,
  headCells,
  isMobile,
  isTablet,
  relativeTime,
}: TableRowComponentProps<Trade>) {
  const {
    createdAt,
    duration,
    isOpen,
    assetId,
    amount,
    soldAssets,
    soldAmounts,
    feeAssets,
    feeAmounts,
  } = row

  const { value: open, toggle: toggleOpen } = useBoolean(false)
  const [priceMap, setPriceMap] = useState<Record<string, ChartData>>()
  const showQuotedAmounts = useStore($showQuotedAmounts)

  useEffect(() => {
    if (priceMap) return
    if (!showQuotedAmounts && !open) return

    $rpc
      .get()
      .getAssetPriceMap($activeAccount.get(), createdAt)
      .then((priceMap) => {
        setPriceMap(priceMap)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showQuotedAmounts, createdAt])

  if (isTablet) {
    return (
      <>
        <TableRow hover tabIndex={-1}>
          <TableCell colSpan={headCells.length}>
            <Typography variant="caption" color="text.secondary">
              <TimestampBlock timestamp={createdAt} relative={relativeTime} />
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Asset:</strong> <AssetBlock assetId={assetId} />
            </Typography>

            <Typography variant="body2">
              <strong>Amount:</strong> {amount}
            </Typography>

            <Typography variant="body2">
              <strong>Status:</strong> {isOpen ? "Open" : "Closed"}
            </Typography>

            {duration || isOpen ? (
              <Typography variant="body2">
                <strong>Duration:</strong>{" "}
                {!duration
                  ? isOpen
                    ? formatDistance(new Date(createdAt), new Date(), { addSuffix: false })
                    : "N/A"
                  : formatDistance(0, duration, { includeSeconds: true })}
              </Typography>
            ) : null}

            {soldAssets && soldAssets.length > 0 ? (
              <Typography variant="body2">
                <strong>Cost:</strong>{" "}
                {soldAssets
                  .map((asset, index) => `${soldAmounts[index]} ${asset.split(":").pop()}`)
                  .join(", ")}
              </Typography>
            ) : null}

            {feeAssets && feeAssets.length > 0 ? (
              <Typography variant="body2">
                <strong>Fees:</strong>{" "}
                {feeAssets
                  .map((asset, index) => `${feeAmounts[index]} ${asset.split(":").pop()}`)
                  .join(", ")}
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

        <TableCell>
          {!duration
            ? isOpen
              ? formatDistance(new Date(createdAt), new Date(), { addSuffix: false })
              : "N/A"
            : formatDistance(0, duration, { includeSeconds: true })}
        </TableCell>

        <TableCell>
          <AssetBlock assetId={assetId} />
        </TableCell>

        <TableCell variant="clickable" align="right">
          <AmountBlock amount={amount} currencyTicker={getAssetTicker(assetId)} />
        </TableCell>

        <TableCell>{isOpen ? "Open" : "Closed"}</TableCell>

        <TableCell>
          {soldAssets && soldAssets.length > 0
            ? soldAssets
                .map((asset, index) => `${soldAmounts[index]} ${asset.split(":").pop()}`)
                .join(", ")
            : "Unknown"}
        </TableCell>

        <TableCell>
          {feeAssets && feeAssets.length > 0
            ? feeAssets
                .map((asset, index) => `${feeAmounts[index]} ${asset.split(":").pop()}`)
                .join(", ")
            : "None"}
        </TableCell>

        <TableCell>
          <TagList itemId={row.id} itemType="trade" />
        </TableCell>

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
