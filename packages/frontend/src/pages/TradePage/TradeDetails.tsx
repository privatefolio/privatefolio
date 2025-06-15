import { Paper, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import Big from "big.js"
import { formatDistance } from "date-fns"
import React, { useEffect, useMemo, useState } from "react"
import { AggregatableValue, AssetAmountsBlock } from "src/components/AssetAmountsBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TagManager } from "src/components/TagManager"
import { TimestampBlock } from "src/components/TimestampBlock"
import { Tag, Trade } from "src/interfaces"
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

  const costBasis = useMemo<AggregatableValue[]>(() => {
    return cost.map(([assetId, amount, usdValue, exposure, txId, txTimestamp]) => [
      assetId,
      Big(amount).div(`-${exposure}`).toString(),
      Big(usdValue).div(`-${exposure}`).toString(),
      txId,
      txTimestamp,
    ])
  }, [cost])

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

        <div>
          <SectionTitle>Cost</SectionTitle>
          <AssetAmountsBlock values={cost} showSign colorized />
        </div>
        <div>
          <SectionTitle>Cost Basis</SectionTitle>
          <AssetAmountsBlock values={costBasis} aggregation="average" formatting="price" />
        </div>
        <div>
          <SectionTitle>Fees</SectionTitle>
          <AssetAmountsBlock values={fees} showSign colorized />
        </div>
        <div>
          <SectionTitle>Proceeds</SectionTitle>
          <AssetAmountsBlock values={proceeds} showSign colorized />
        </div>

        {/* <div>
          <SectionTitle>Realized profit</SectionTitle>
        </div> */}

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
