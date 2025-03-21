import { ArrowRightAltRounded, CloseRounded } from "@mui/icons-material"
import { Button, Drawer, DrawerProps, IconButton, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { formatDistance } from "date-fns"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AmountBlock } from "src/components/AmountBlock"
import { AppLink } from "src/components/AppLink"
import { AssetBlock } from "src/components/AssetBlock"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TagManager } from "src/components/TagManager"
import { TimestampBlock } from "src/components/TimestampBlock"
import { ValueChip } from "src/components/ValueChip"
import { ChartData, Tag, Trade } from "src/interfaces"
import { $activeAccount, $activeIndex } from "src/stores/account-store"
import { PopoverToggleProps } from "src/stores/app-store"
import { getAssetTicker } from "src/utils/assets-utils"
import { $rpc } from "src/workers/remotes"

type TradeDrawerProps = DrawerProps &
  PopoverToggleProps & {
    priceMap?: Record<string, ChartData>
    relativeTime: boolean
    trade: Trade
  }

export function TradeDrawer(props: TradeDrawerProps) {
  const { open, toggleOpen, trade, relativeTime, priceMap, ...rest } = props
  const activeIndex = useStore($activeIndex)
  const activeAccount = useStore($activeAccount)

  const {
    id,
    assetId,
    amount,
    balance,
    createdAt,
    closedAt,
    duration,
    isOpen,
    soldAssets,
    soldAmounts,
    feeAssets,
    feeAmounts,
  } = trade

  const [tags, setTags] = useState<Tag[]>([])
  const [auditLogIds, setAuditLogIds] = useState<string[]>([])
  const [transactionIds, setTransactionIds] = useState<string[]>([])

  useEffect(() => {
    if (open && id && activeAccount) {
      $rpc.get().getTradeAuditLogs(activeAccount, id).then(setAuditLogIds)
      $rpc.get().getTradeTransactions(activeAccount, id).then(setTransactionIds)
    }
  }, [id, open, activeAccount])

  useEffect(() => {
    if (open) {
      $rpc.get().getTagsForTrade(activeAccount, id).then(setTags)
    }
  }, [id, open, activeAccount])

  return (
    <Drawer open={open} onClose={toggleOpen} {...rest}>
      <Stack
        paddingX={2}
        paddingY={1}
        gap={2}
        sx={(theme) => ({
          maxWidth: 358,
          minWidth: 358,
          overflowX: "hidden",
          ...theme.typography.body2,
        })}
      >
        <Stack marginBottom={2} direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" letterSpacing="0.025rem">
            Trade details
          </Typography>
          <IconButton onClick={toggleOpen} edge="end" color="secondary" aria-label="Close dialog">
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>

        <div>
          <SectionTitle>Identifier</SectionTitle>
          <IdentifierBlock id={id} />
        </div>

        <div>
          <SectionTitle>Asset</SectionTitle>
          <Stack direction="row" alignItems="center" gap={0.25}>
            <Button
              size="small"
              component={AppLink}
              to={`../asset/${encodeURI(assetId)}`}
              sx={{ fontSize: "0.9rem", padding: 1 }}
            >
              <AssetBlock assetId={assetId} size="small" />
            </Button>
          </Stack>
        </div>

        <div>
          <SectionTitle>Creation Date</SectionTitle>
          <TimestampBlock timestamp={createdAt} relative={relativeTime} />
        </div>

        {closedAt && (
          <div>
            <SectionTitle>Closed Date</SectionTitle>
            <TimestampBlock timestamp={closedAt} relative={relativeTime} />
          </div>
        )}

        <div>
          <SectionTitle>Status</SectionTitle>
          <Typography>{isOpen ? "Open" : "Closed"}</Typography>
        </div>

        {duration && (
          <div>
            <SectionTitle>Duration</SectionTitle>
            <Typography>{formatDistance(0, duration, { includeSeconds: true })}</Typography>
          </div>
        )}

        <div>
          <SectionTitle>Amount</SectionTitle>
          <AmountBlock amount={amount} currencyTicker={getAssetTicker(assetId)} variant="body1" />
        </div>

        {balance !== undefined && (
          <div>
            <SectionTitle>Current Balance</SectionTitle>
            <AmountBlock
              amount={balance}
              currencyTicker={getAssetTicker(assetId)}
              variant="body1"
            />
          </div>
        )}

        {soldAssets && soldAssets.length > 0 && (
          <div>
            <SectionTitle>Cost</SectionTitle>
            <Stack direction="column" gap={1}>
              {soldAssets.map((asset, index) => (
                <Stack key={asset} direction="row" alignItems="center" gap={0.25}>
                  <AmountBlock
                    amount={soldAmounts[index]}
                    currencyTicker={getAssetTicker(asset)}
                    variant="body2"
                  />
                  <Button
                    size="small"
                    component={AppLink}
                    to={`../asset/${encodeURI(asset)}`}
                    sx={{ fontSize: "0.8rem", padding: 0.5 }}
                  >
                    <AssetBlock assetId={asset} size="small" />
                  </Button>
                  <ValueChip
                    value={
                      priceMap && priceMap[asset]?.value
                        ? priceMap[asset].value * Number(soldAmounts[index])
                        : undefined
                    }
                  />
                </Stack>
              ))}
            </Stack>
          </div>
        )}

        {feeAssets && feeAssets.length > 0 && (
          <div>
            <SectionTitle>Fees</SectionTitle>
            <Stack direction="column" gap={1}>
              {feeAssets.map((asset, index) => (
                <Stack key={asset} direction="row" alignItems="center" gap={0.25}>
                  <AmountBlock
                    amount={feeAmounts[index]}
                    currencyTicker={getAssetTicker(asset)}
                    variant="body2"
                  />
                  <Button
                    size="small"
                    component={AppLink}
                    to={`../asset/${encodeURI(asset)}`}
                    sx={{ fontSize: "0.8rem", padding: 0.5 }}
                  >
                    <AssetBlock assetId={asset} size="small" />
                  </Button>
                  <ValueChip
                    value={
                      priceMap && priceMap[asset]?.value
                        ? priceMap[asset].value * Number(feeAmounts[index])
                        : undefined
                    }
                  />
                </Stack>
              ))}
            </Stack>
          </div>
        )}

        {transactionIds && transactionIds.length > 0 && (
          <div>
            <SectionTitle>Transactions</SectionTitle>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="body2">{transactionIds.length}</Typography>
              <Button
                size="small"
                color="secondary"
                component={Link}
                to={`/u/${activeIndex}/transactions?tradeId=${id}`}
                sx={{ paddingX: 2 }}
                endIcon={<ArrowRightAltRounded fontSize="inherit" />}
              >
                Inspect
              </Button>
            </Stack>
          </div>
        )}

        {auditLogIds && auditLogIds.length > 0 && (
          <div>
            <SectionTitle>Audit Logs</SectionTitle>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="body2">{auditLogIds.length}</Typography>
              <Button
                size="small"
                color="secondary"
                component={Link}
                to={`/u/${activeIndex}/audit-logs?tradeId=${id}`}
                sx={{ paddingX: 2 }}
                endIcon={<ArrowRightAltRounded fontSize="inherit" />}
              >
                Inspect
              </Button>
            </Stack>
          </div>
        )}

        <div>
          <SectionTitle>Tags</SectionTitle>
          <TagManager tags={tags} setTags={setTags} itemId={id} itemType="trade" />
        </div>
      </Stack>
    </Drawer>
  )
}
