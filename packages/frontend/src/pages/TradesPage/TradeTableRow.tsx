import { Stack, TableCell, TableRow, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { ActionBlock } from "src/components/ActionBlock"
import { AppLink } from "src/components/AppLink"
import { AssetAmountBlock } from "src/components/AssetAmountBlock"
import { AssetAmountsBlock } from "src/components/AssetAmountsBlock"
import { AssetBlock } from "src/components/AssetBlock"
import { CaptionText } from "src/components/CaptionText"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { TimestampBlock } from "src/components/TimestampBlock"
import { useTradeBreakdown } from "src/hooks/useTradeBreakdown"
import { ChartData, Trade } from "src/interfaces"
import { $activeAccount, $activeAccountPath } from "src/stores/account-store"
import { $inspectTime } from "src/stores/pages/balances-store"
import { TableRowComponentProps } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

export function TradeTableRow({
  row,
  headCells: _headCells,
  isMobile: _isMobile,
  isTablet,
  relativeTime,
  ...rest
}: TableRowComponentProps<Trade>) {
  const { createdAt, tradeStatus: status, assetId, amount, tradeType, tradeNumber, closedAt } = row
  const [priceMap, setPriceMap] = useState<Record<string, ChartData>>()

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const activeAccountPath = useStore($activeAccountPath)

  const inspectTime = useStore($inspectTime)
  useEffect(() => {
    rpc
      .getAssetPriceMap(activeAccount, inspectTime || (status === "closed" ? closedAt : undefined))
      .then((priceMap) => {
        setPriceMap(priceMap)
      })
  }, [closedAt, rpc, activeAccount, inspectTime, status])

  const { costBasis, tradePnl } = useTradeBreakdown(row)

  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell variant="clickable">
          <AssetBlock
            id={assetId}
            size="medium"
            variant="tablecell"
            secondary={
              <QuoteAmountBlock
                amount={priceMap?.[assetId]?.value}
                formatting="price"
                hideTooltip
              />
            }
            href={`${activeAccountPath}/trade/${row.id}`}
            linkText="View trade"
          />
        </TableCell>
        <TableCell>
          <Stack alignItems="flex-end">
            <QuoteAmountBlock amount={tradePnl?.pnl} showSign colorized />
            <CaptionText>
              <span>{tradeType}</span>{" "}
              <AssetAmountBlock amount={amount} assetId={assetId} priceMap={priceMap} showTicker />
            </CaptionText>
          </Stack>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow hover tabIndex={-1}>
      <TableCell variant="clickable">
        <Tooltip title="View trade">
          <AppLink href={`${activeAccountPath}/trade/${row.id}`}>{tradeNumber}</AppLink>
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
      <TableCell variant="clickable">
        <AssetBlock id={assetId} variant="tablecell" />
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
  )
}
