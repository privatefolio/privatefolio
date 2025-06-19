import { Stack, TableCell, TableRow, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import Big from "big.js"
import React, { useEffect, useMemo, useState } from "react"
import { ActionBlock } from "src/components/ActionBlock"
import { AppLink } from "src/components/AppLink"
import { AssetAmountBlock } from "src/components/AssetAmountBlock"
import { AggregatableValue, AssetAmountsBlock } from "src/components/AssetAmountsBlock"
import { CaptionText } from "src/components/CaptionText"
import { MyAssetBlock } from "src/components/MyAssetBlock"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { TimestampBlock } from "src/components/TimestampBlock"
import { ChartData, SqlParam, Trade, TradePnL } from "src/interfaces"
import { $activeAccount, $activeAccountPath } from "src/stores/account-store"
import { $inspectTime } from "src/stores/pages/balances-store"
import { TableRowComponentProps } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

export function TradeTableRow({
  row,
  headCells,
  isMobile: _isMobile,
  isTablet,
  relativeTime,
  ...rest
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
    const params: SqlParam[] = [row.id]
    let query = "SELECT * FROM trade_pnl WHERE trade_id = ? ORDER BY timestamp DESC LIMIT 1"

    if (inspectTime) {
      query = `SELECT * FROM trade_pnl WHERE trade_id = ? AND timestamp <= ? ORDER BY timestamp DESC LIMIT 1`
      params.push(inspectTime)
    }

    rpc
      .getTradePnL(activeAccount, row.id, query, params)
      .then((pnl) => {
        if (pnl.length > 0) {
          setTradePnl(pnl[0])
        } else {
          setTradePnl(null)
        }
      })
      .catch((error) => {
        console.error(error)
        setTradePnl(null)
      })
  }, [activeAccount, rpc, row.id, inspectTime])

  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell colSpan={headCells.length} variant="clickable">
          <Stack gap={1} direction="row" justifyContent="space-between" alignItems="flex-start">
            <AppLink to={`${activeAccountPath}/trade/${row.id}`}>
              <MyAssetBlock
                id={assetId}
                size="medium"
                secondary={
                  <QuoteAmountBlock amount={priceMap?.[assetId]?.value} formatting="price" />
                }
              />
            </AppLink>
            <Stack alignItems="flex-end">
              <QuoteAmountBlock amount={tradePnl?.pnl} showSign colorized />
              <CaptionText>
                <span>{tradeType}</span>{" "}
                <AssetAmountBlock
                  amount={amount}
                  assetId={assetId}
                  priceMap={priceMap}
                  showTicker
                />
              </CaptionText>
            </Stack>
          </Stack>
        </TableCell>
      </TableRow>
    )
  }

  return (
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
  )
}
