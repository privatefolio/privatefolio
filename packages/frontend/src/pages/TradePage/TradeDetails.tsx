import { Paper, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { formatDistance } from "date-fns"
import React, { useEffect, useState } from "react"
import { AssetAmountsBlock } from "src/components/AssetAmountsBlock"
import { LearnMore } from "src/components/LearnMore"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TagManager } from "src/components/TagManager"
import { TimestampBlock } from "src/components/TimestampBlock"
import { useTradeBreakdown } from "src/hooks/useTradeBreakdown"
import { Tag, Trade } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

interface TradeDetailsProps {
  trade: Trade
}

export function TradeDetails({ trade }: TradeDetailsProps) {
  const { duration, createdAt, cost, fees, proceeds, id } = trade

  const activeAccount = useStore($activeAccount)
  const rpc = useStore($rpc)

  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    rpc.getTagsForTrade(activeAccount, id).then(setTags)
  }, [id, activeAccount, rpc])

  const { avgSellPrice, costBasis, deposits, depositsCostBasis, tradePnl, withdrawals } =
    useTradeBreakdown(trade)

  return (
    <Paper sx={{ paddingX: 2, paddingY: 1 }}>
      <Typography variant="body2" component={Stack} gap={2} alignItems="flex-start">
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
        {avgSellPrice.length > 0 && (
          <div>
            <LearnMore title="Average sell price of the assets in this trade.">
              <SectionTitle>Avg. sell price</SectionTitle>
            </LearnMore>
            <AssetAmountsBlock values={avgSellPrice} aggregation="average" formatting="price" />
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
