import { Paper, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import Big from "big.js"
import { formatDistance } from "date-fns"
import React, { useEffect, useMemo, useState } from "react"
import { AggregatableValue, AssetAmountsBlock } from "src/components/AssetAmountsBlock"
import { LearnMore } from "src/components/LearnMore"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TagManager } from "src/components/TagManager"
import { TimestampBlock } from "src/components/TimestampBlock"
import { Tag, Trade, TradePnL } from "src/interfaces"
import { $quoteCurrency } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

interface TradeDetailsProps {
  trade: Trade
}

export function TradeDetails({ trade }: TradeDetailsProps) {
  const { duration, createdAt, cost, fees, proceeds, id } = trade

  const activeAccount = useStore($activeAccount)
  const [tags, setTags] = useState<Tag[]>([])
  // const [auditLogIds, setAuditLogIds] = useState<string[]>([])
  // const [transactionIds, setTransactionIds] = useState<string[]>([])
  const rpc = useStore($rpc)

  // useEffect(() => {
  //   if (id && activeAccount) {
  //     rpc.getTradeAuditLogs(activeAccount, id).then(setAuditLogIds)
  //     rpc.getTradeTransactions(activeAccount, id).then(setTransactionIds)
  //   }
  // }, [id, activeAccount, rpc])

  useEffect(() => {
    rpc.getTagsForTrade(activeAccount, id).then(setTags)
  }, [id, activeAccount, rpc])

  const deposits = useMemo<AggregatableValue[]>(() => {
    return trade.deposits.filter(([_, amount]) => Big(amount).gt(0))
  }, [trade.deposits])

  const withdrawals = useMemo<AggregatableValue[]>(() => {
    return trade.deposits.filter(([_, amount]) => Big(amount).lt(0))
  }, [trade.deposits])

  const costBasis = useMemo<AggregatableValue[]>(() => {
    return cost.map(([assetId, amount, usdValue, exposure, txId, txTimestamp]) => [
      assetId,
      Big(amount).div(`-${exposure}`).toString(),
      Big(usdValue).div(`-${exposure}`).toString(),
      txId,
      txTimestamp,
    ])
  }, [cost])

  const currency = useStore($quoteCurrency)
  const depositsCostBasis = useMemo<AggregatableValue[]>(
    () =>
      trade.deposits.map(([_assetId, amount, usdValue, txId, txTimestamp]) => {
        const costBasis = Big(usdValue).div(amount).toString()
        return [currency.id, costBasis, costBasis, txId, txTimestamp]
      }),
    [trade.deposits, currency]
  )

  const [tradePnl, setTradePnl] = useState<TradePnL | undefined | null>()

  useEffect(() => {
    rpc
      .getTradePnL(
        activeAccount,
        id,
        "SELECT * FROM trade_pnl WHERE trade_id = ? ORDER BY timestamp DESC LIMIT 1"
      )
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
  }, [activeAccount, rpc, id])

  return (
    <Paper sx={{ paddingX: 2, paddingY: 1 }}>
      <Typography variant="body2" component={Stack} gap={2}>
        <div>
          <SectionTitle>Opened at</SectionTitle>
          <TimestampBlock timestamp={trade.createdAt} />
        </div>

        {trade?.closedAt && (
          <div>
            <SectionTitle>Closed at</SectionTitle>
            <TimestampBlock timestamp={trade.closedAt} />
          </div>
        )}

        <div>
          <SectionTitle>Duration</SectionTitle>
          <span>
            {!duration
              ? formatDistance(new Date(createdAt), new Date(), { addSuffix: false })
              : formatDistance(0, duration, { includeSeconds: true })}
          </span>
        </div>

        {deposits.length > 0 && (
          <div>
            <LearnMore title="These are the assets you deposited into this trade.">
              <SectionTitle>Deposits</SectionTitle>
            </LearnMore>
            <AssetAmountsBlock values={deposits} showSign colorized />
          </div>
        )}
        {depositsCostBasis.length > 0 && (
          <div>
            <LearnMore title="Cost basis is the average cost of the assets in the trade (calculated from deposits & withdrawals).">
              <SectionTitle>Cost basis of deposits</SectionTitle>
            </LearnMore>
            <AssetAmountsBlock
              values={depositsCostBasis}
              aggregation="average"
              formatting="price"
            />
          </div>
        )}
        {withdrawals.length > 0 && (
          <div>
            <LearnMore title="These are the assets you withdrew from this trade.">
              <SectionTitle>Withdrawals</SectionTitle>
            </LearnMore>
            <AssetAmountsBlock values={withdrawals} showSign colorized />
          </div>
        )}
        {cost.length > 0 && (
          <div>
            <LearnMore title="These are the assets you sold in this trade.">
              <SectionTitle>Cost</SectionTitle>
            </LearnMore>
            <AssetAmountsBlock values={cost} showSign colorized />
          </div>
        )}
        {fees.length > 0 && (
          <div>
            <LearnMore title="These are the fees you paid in this trade.">
              <SectionTitle>Fees</SectionTitle>
            </LearnMore>
            <AssetAmountsBlock values={fees} showSign colorized />
          </div>
        )}
        {proceeds.length > 0 && (
          <div>
            <LearnMore title="These are the assets you received from this trade.">
              <SectionTitle>Proceeds</SectionTitle>
            </LearnMore>
            <AssetAmountsBlock values={proceeds} showSign colorized />
          </div>
        )}
        {costBasis.length > 0 && (
          <div>
            <LearnMore title="Cost basis is the average cost of the assets in the trade.">
              <SectionTitle>Cost basis</SectionTitle>
            </LearnMore>
            <AssetAmountsBlock values={costBasis} aggregation="average" formatting="price" />
          </div>
        )}
        <div>
          <LearnMore title="This is the profit you made from this trade.">
            <SectionTitle>Profit</SectionTitle>
          </LearnMore>
          <QuoteAmountBlock amount={tradePnl?.pnl} showSign colorized />
        </div>

        {/* TODO8 */}
        {/* {transactionIds && transactionIds.length > 0 && (
          <div>
            <SectionTitle>Transactions</SectionTitle>
            {transactionIds.length}
          </div>
        )}

        {auditLogIds && auditLogIds.length > 0 && (
          <div>
            <SectionTitle>Audit Logs</SectionTitle>
            {auditLogIds.length}
          </div>
        )} */}

        <div>
          <SectionTitle>Tags</SectionTitle>
          <TagManager tags={tags} setTags={setTags} itemId={id} itemType="trade" />
        </div>
      </Typography>
    </Paper>
  )
}
