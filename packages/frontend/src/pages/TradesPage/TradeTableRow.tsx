import { TableCell, TableRow, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import Big from "big.js"
import React, { useEffect, useMemo, useState } from "react"
import { ActionBlock } from "src/components/ActionBlock"
import { AppLink } from "src/components/AppLink"
import { AssetAmountBlock } from "src/components/AssetAmountBlock"
import { AggregatableValue, AssetAmountsBlock } from "src/components/AssetAmountsBlock"
import { MyAssetBlock } from "src/components/MyAssetBlock"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { TimestampBlock } from "src/components/TimestampBlock"
import { ChartData, Trade, TradePnL } from "src/interfaces"
import { $showQuotedAmounts } from "src/stores/account-settings-store"
import { $activeAccount, $activeAccountPath } from "src/stores/account-store"
import { TableRowComponentProps } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

export function TradeTableRow({
  row,
  headCells: _headCells,
  isMobile: _isMobile,
  isTablet: _isTablet,
  relativeTime,
}: TableRowComponentProps<Trade>) {
  const {
    createdAt,
    tradeStatus: status,
    assetId,
    amount,
    tradeType,
    cost,
    tradeNumber,
    closedAt,
  } = row

  const [priceMap, setPriceMap] = useState<Record<string, ChartData>>()
  const showQuotedAmounts = useStore($showQuotedAmounts)

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const activeAccountPath = useStore($activeAccountPath)

  useEffect(() => {
    if (priceMap) return
    if (!showQuotedAmounts) return

    rpc
      .getAssetPriceMap(activeAccount, status === "closed" ? closedAt : undefined)
      .then((priceMap) => {
        setPriceMap(priceMap)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuotedAmounts, createdAt, rpc, activeAccount])

  // TODO9
  // if (isTablet) {
  //   return (
  //     <>
  //       <TableRow hover tabIndex={-1}>
  //         <TableCell colSpan={headCells.length}>
  //           <Typography variant="caption" color="text.secondary">
  //             <TimestampBlock timestamp={createdAt} relative={relativeTime} />
  //           </Typography>

  //           <Typography variant="body2" sx={{ mt: 1 }}>
  //             <strong>Asset:</strong> <MyAssetBlock id={assetId} />
  //           </Typography>

  //           <Typography variant="body2">
  //             <strong>Amount:</strong> {amount}
  //           </Typography>

  //           <Typography variant="body2">
  //             <strong>Direction:</strong> <ActionBlock action={tradeType} />
  //             <strong>Status:</strong> {status}
  //           </Typography>

  //           <Typography variant="body2">
  //             <strong>Duration:</strong>{" "}
  //             {!duration
  //               ? formatDistance(new Date(createdAt), new Date(), { addSuffix: false })
  //               : formatDistance(0, duration, { includeSeconds: true })}
  //           </Typography>

  //           {cost && cost.length > 0 ? (
  //             <Typography variant="body2">
  //               <strong>Cost:</strong>{" "}
  //               {cost.map(([asset, amount]) => `${amount} ${asset.split(":").pop()}`).join(", ")}
  //             </Typography>
  //           ) : null}

  //           {fees && fees.length > 0 ? (
  //             <Typography variant="body2">
  //               <strong>Fees:</strong>{" "}
  //               {fees.map(([asset, amount]) => `${amount} ${asset.split(":").pop()}`).join(", ")}
  //             </Typography>
  //           ) : null}

  //           {proceeds && proceeds.length > 0 ? (
  //             <Typography variant="body2">
  //               <strong>Proceeds:</strong>{" "}
  //               {proceeds.map(([asset, amount]) => `${amount} ${asset.split(":").pop()}`).join(", ")}
  //             </Typography>
  //           ) : null}

  //           <Tooltip title="View Details">
  //             <IconButton
  //               size="small"
  //               color="secondary"
  //               component={AppLink}
  //               to={`../trade/${row.id}`}
  //               sx={{ mt: 1 }}
  //             >
  //               <Visibility fontSize="inherit" />
  //             </IconButton>
  //           </Tooltip>
  //         </TableCell>
  //       </TableRow>
  //     </>
  //   )
  // }

  const costBasis = useMemo<AggregatableValue[]>(() => {
    return cost.map(([assetId, amount, usdValue, exposure, txId, txTimestamp]) => [
      assetId,
      Big(amount).div(`-${exposure}`).toString(),
      Big(usdValue).div(`-${exposure}`).toString(),
      txId,
      txTimestamp,
    ])
  }, [cost])

  const [tradePnl, setTradePnl] = useState<TradePnL | undefined | null>()

  useEffect(() => {
    rpc
      .getTradePnL(
        activeAccount,
        row.id,
        "SELECT * FROM trade_pnl WHERE trade_id = ? ORDER BY timestamp DESC LIMIT 1"
      )
      .then((pnl) => {
        if (pnl.length > 0) {
          setTradePnl(pnl[0])
        } else {
          setTradePnl(null)
        }
      })
      .catch(() => {
        setTradePnl(null)
      })
  }, [activeAccount, rpc, row.id])

  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell variant="clickable">
          <Tooltip title="View trade">
            <AppLink to={`${activeAccountPath}/trade/${row.id}`}>{tradeNumber}</AppLink>
          </Tooltip>
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
          <AssetAmountBlock amount={amount} assetId={assetId} priceMap={priceMap} />
        </TableCell>
        <TableCell>
          <MyAssetBlock id={assetId} />
        </TableCell>

        <TableCell>
          <AssetAmountsBlock values={costBasis} aggregation="average" formatting="price" />
        </TableCell>
        <TableCell>
          <QuoteAmountBlock amount={priceMap?.[assetId]?.value} formatting="price" />
        </TableCell>
        <TableCell>
          <QuoteAmountBlock amount={tradePnl?.pnl} showSign colorized />
          {/* <AssetAmountsBlock values={proceeds} showSign colorized /> */}
        </TableCell>
        <TableCell>
          <TimestampBlock timestamp={createdAt} relative={relativeTime} />
        </TableCell>
        {/* <TableCell>
          <TagList itemId={row.id} itemType="trade" />
        </TableCell> */}
      </TableRow>
    </>
  )
}
