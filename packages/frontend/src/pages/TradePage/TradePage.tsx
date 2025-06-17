import { CandlestickChart } from "@mui/icons-material"
import { Avatar, Badge, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { AssetAmountBlock } from "src/components/AssetAmountBlock"
import { BackButton } from "src/components/BackButton"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { MyAssetBlock } from "src/components/MyAssetBlock"
import { NavTab } from "src/components/NavTab"
import { Tabs } from "src/components/Tabs"
import { ChartData, Trade } from "src/interfaces"
import { $showQuotedAmounts } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { $assetMap } from "src/stores/metadata-store"
import { ONE_DAY } from "src/utils/formatting-utils"
import { $rpc } from "src/workers/remotes"

import { SerifFont } from "../../theme"
import FourZeroFourPage from "../404"
import { AssetBalanceHistory } from "../AssetPage/AssetBalanceHistory"
import { AssetPriceHistory } from "../AssetPage/AssetPriceHistory"
import { AuditLogTable } from "../AuditLogsPage/AuditLogTable"
import { PnLChart } from "../PnLPage/PnLChart"
import { TradeActions } from "../TradesPage/TradeActions"
import { TransactionTable } from "../TransactionsPage/TransactionTable"
import { TradeDetails } from "./TradeDetails"
import { TradeStatusIcon } from "./TradeStatusIcon"

export default function TradePage() {
  const params = useParams()
  const tradeId = params.tradeId
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "details"
  const [trade, setTrade] = useState<Trade>()
  const [isLoading, setLoading] = useState(true)

  const activeAccount = useStore($activeAccount)
  const rpc = useStore($rpc)

  useEffect(() => {
    document.title = `Trade #${trade?.tradeNumber || tradeId} - ${activeAccount} - Privatefolio`
  }, [tradeId, activeAccount, trade])

  useEffect(() => {
    if (!tradeId) {
      setLoading(false)
      return
    }

    setLoading(true)
    rpc
      .getTrade(activeAccount, tradeId)
      .then(setTrade)
      .finally(() => setLoading(false))
  }, [activeAccount, tradeId, rpc])

  const [priceMap, setPriceMap] = useState<Record<string, ChartData>>()
  const showQuotedAmounts = useStore($showQuotedAmounts)

  const assetMap = useStore($assetMap)

  useEffect(() => {
    if (priceMap) return
    if (!showQuotedAmounts) return
    if (!trade) return

    rpc
      .getAssetPriceMap(activeAccount, trade.tradeStatus === "closed" ? trade.closedAt : undefined)
      .then((priceMap) => {
        setPriceMap(priceMap)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuotedAmounts, trade, rpc, activeAccount])

  if (isLoading) return <DefaultSpinner />
  if (!tradeId || !trade) return <FourZeroFourPage show type="Trade" />

  return (
    <Stack component="main" gap={2}>
      <BackButton sx={{ marginLeft: 1 }} fallback="../trades">
        Back
      </BackButton>
      <Stack
        direction="row"
        alignItems="center"
        width="100%"
        paddingBottom={2}
        flexWrap="wrap"
        justifyContent="space-between"
        gap={6}
        sx={{ paddingX: 2 }}
      >
        <Stack direction="row" gap={1} component="div" alignItems="center">
          <Badge
            overlap="circular"
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            badgeContent={
              <Stack
                sx={{
                  backgroundColor: "var(--mui-palette-background-default)",
                  borderRadius: "50%",
                }}
                alignItems="center"
                justifyContent="center"
              >
                <TradeStatusIcon status={trade.tradeStatus} />
              </Stack>
            }
          >
            <Avatar
              sx={{
                background:
                  "rgba(var(--mui-palette-primary-mainChannel) / var(--mui-palette-action-hoverOpacity))",
                borderRadius: 5,
                height: 50,
                width: 50,
              }}
            >
              <CandlestickChart color="primary" fontSize="large" />
            </Avatar>
          </Badge>
          <Stack>
            <Typography variant="h6" fontFamily={SerifFont} sx={{ marginBottom: -0.25 }}>
              <span>Trade #{trade.tradeNumber}</span>{" "}
            </Typography>
            <Typography
              color="text.secondary"
              variant="subtitle2"
              fontWeight={400}
              letterSpacing={0.5}
              component={Stack}
              direction="row"
              gap={1}
              alignItems="flex-end"
            >
              {/* <ActionBlock action={trade.tradeType} size="small" /> */}
              <span>{trade.tradeType}</span>
              <AssetAmountBlock amount={trade.amount} assetId={trade.assetId} priceMap={priceMap} />
              <MyAssetBlock id={trade.assetId} />
            </Typography>
          </Stack>
        </Stack>
      </Stack>
      <Stack>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Tabs value={tab} defaultValue={tab}>
            <NavTab value="details" to={`?tab=details`} label="Details" />
            <NavTab value="pnl" to="?tab=pnl" label="Profit & loss" />
            <NavTab value="exposure" to={`?tab=exposure`} label={"Exposure"} />
            <NavTab value="price-history" to={`?tab=price-history`} label="Price history" />
            <NavTab value="transactions" to={`?tab=transactions`} label="Transactions" />
            <NavTab value="audit-logs" to={`?tab=audit-logs`} label="Audit logs" />
          </Tabs>
          <TradeActions />
        </Stack>
        {tab === "details" && <TradeDetails trade={trade} />}
        {tab === "pnl" && <PnLChart trade={trade} />}
        {tab === "exposure" && (
          <AssetBalanceHistory
            assetId={trade.assetId}
            start={trade.createdAt ? trade.createdAt - ONE_DAY - ONE_DAY : undefined}
            end={trade.closedAt}
          />
        )}
        {tab === "transactions" && <TransactionTable tradeId={tradeId} defaultRowsPerPage={10} />}
        {tab === "audit-logs" && <AuditLogTable tradeId={tradeId} defaultRowsPerPage={10} />}
        {tab === "price-history" && <AssetPriceHistory asset={assetMap[trade.assetId]} />}
      </Stack>
    </Stack>
  )
}
