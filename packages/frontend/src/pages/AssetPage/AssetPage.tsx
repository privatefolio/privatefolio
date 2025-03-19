import { Skeleton, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { getFullMetadata } from "privatefolio-backend/src/api/external/assets/coingecko-asset-api"
import { getCachedAssetMeta } from "privatefolio-backend/src/api/external/assets/coingecko-asset-cache"
import React, { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { AmountBlock } from "src/components/AmountBlock"
import { CircularSpinner } from "src/components/CircularSpinner"
import { NavTab } from "src/components/NavTab"
import { PlatformBlock } from "src/components/PlatformBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { Tabs } from "src/components/Tabs"
import { Balance, CoingeckoMetadataFull } from "src/interfaces"
import { $quoteCurrency } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"
import { $rpc } from "src/workers/remotes"

import { AssetAvatar } from "../../components/AssetAvatar"
import { $assetMap, $filterOptionsMap } from "../../stores/metadata-store"
import { SerifFont } from "../../theme"
import FourZeroFourPage from "../404"
import { AuditLogTable } from "../AuditLogsPage/AuditLogTable"
import { TransactionTable } from "../TransactionsPage/TransactionTable"
import { AssetInfo } from "./AssetInfo"
import { AssetMarketTable } from "./AssetMarketTable"
import { BalanceChart } from "./BalanceChart"
import { PriceChart } from "./PriceChart"

export default function AssetPage() {
  const params = useParams()
  const assetId = params.assetId // ?.toLocaleUpperCase()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || ""
  const assetMap = useStore($assetMap)

  const filterMap = useStore($filterOptionsMap)

  const [balances, setBalances] = useState<Balance[]>()

  const activeAccount = useStore($activeAccount)
  const currency = useStore($quoteCurrency)

  useEffect(() => {
    document.title = `${getAssetTicker(assetId)} - ${activeAccount} - Privatefolio`
  }, [assetId, activeAccount])

  useEffect(() => {
    $rpc
      .get()
      .getBalancesAt(activeAccount)
      .then((balances) => {
        // fetch no longer accurate
        if (activeAccount !== $activeAccount.get()) return
        setBalances(balances)
      })
  }, [activeAccount])

  const balance = useMemo(
    () =>
      balances?.find((obj) => {
        return obj.assetId === assetId
      }),
    [balances, assetId]
  )

  const [isLoading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState<CoingeckoMetadataFull | null>(null)

  useEffect(() => {
    if (!assetId) return

    setLoading(true)
    getCachedAssetMeta(assetId)
      .then((x) => (x.coingeckoId ? getFullMetadata(x.coingeckoId) : null))
      .then(setMetadata)
      .finally(() => setLoading(false))
  }, [assetId])

  if (!filterMap.assetId) {
    return (
      <Stack component="main" gap={2} alignItems="center">
        <CircularSpinner color="secondary" />
      </Stack>
    )
  }

  if (!assetId) {
    return <FourZeroFourPage show />
  }

  return (
    <Stack component="main" gap={2}>
      {/* <BackButton to=".." sx={{ marginLeft: 1 }}>
        Back
      </BackButton> */}
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
          <AssetAvatar
            size="large"
            src={assetMap[assetId]?.logoUrl || metadata?.image.large}
            alt={getAssetTicker(assetId)}
          />
          <Stack>
            <Typography variant="h6" fontFamily={SerifFont} sx={{ marginBottom: -0.5 }}>
              <span>{getAssetTicker(assetId)}</span>
            </Typography>
            <Typography
              color="text.secondary"
              variant="subtitle2"
              fontWeight={300}
              letterSpacing={0.5}
            >
              {assetMap[assetId]?.name || metadata?.name}
            </Typography>
          </Stack>
        </Stack>
        <Stack
          gap={6}
          direction="row"
          // sx={{
          //   "& > div": {
          //     minWidth: 120,
          //   },
          // }}
        >
          {metadata && (
            <>
              <div>
                <SectionTitle>Rank</SectionTitle>
                <span>#{metadata.market_cap_rank}</span>
              </div>
              {metadata.market_data?.current_price?.usd && (
                <div>
                  <SectionTitle>Current Price</SectionTitle>
                  <AmountBlock
                    amount={metadata.market_data.current_price.usd}
                    currencySymbol={currency.symbol}
                    currencyTicker={currency.id}
                  />
                </div>
              )}
              {metadata.market_data?.market_cap?.usd && (
                <div>
                  <SectionTitle>Market Cap</SectionTitle>
                  <AmountBlock
                    amount={metadata.market_data.market_cap.usd}
                    currencySymbol={currency.symbol}
                    significantDigits={currency.maxDigits}
                    maxDigits={currency.maxDigits}
                    currencyTicker={currency.id}
                  />
                </div>
              )}
            </>
          )}
          {getAssetPlatform(assetId) && (
            <div>
              <SectionTitle>Platform</SectionTitle>
              <PlatformBlock platform={getAssetPlatform(assetId)} />
            </div>
          )}
          <div>
            <SectionTitle>Balance</SectionTitle>
            {!balances ? (
              <Skeleton width="100%" />
            ) : (
              <AmountBlock
                amount={balance?.balanceN || 0}
                currencyTicker={getAssetTicker(assetId)}
                showTicker
              />
            )}
          </div>
          <div>
            <SectionTitle>Value</SectionTitle>
            {!balances ? (
              <Skeleton width="100%" />
            ) : (
              <AmountBlock
                amount={balance?.value || 0}
                currencySymbol={currency.symbol}
                significantDigits={currency.maxDigits}
                maxDigits={currency.maxDigits}
                currencyTicker={currency.id}
              />
            )}
          </div>
        </Stack>
      </Stack>
      <Stack>
        <Tabs value={tab}>
          <NavTab value="" to="" label="Price history" />
          <NavTab value="balance" to={`?tab=balance`} label="Balance history" />
          {/* <NavTab value="pnl" to={`?tab=pnl`} label="Profit & Loss"  /> */}
          <NavTab value="transactions" to={`?tab=transactions`} label="Transactions" />
          <NavTab value="audit-logs" to={`?tab=audit-logs`} label="Audit logs" />
          <NavTab value="info" to={`?tab=info`} label="Info" />
          <NavTab value="markets" to={`?tab=markets`} label="Markets" />
        </Tabs>
        {tab === "" && <PriceChart symbol={assetId} />}
        {tab === "balance" && <BalanceChart symbol={assetId} />}
        {tab === "transactions" && <TransactionTable assetId={assetId} defaultRowsPerPage={10} />}
        {tab === "audit-logs" && <AuditLogTable assetId={assetId} defaultRowsPerPage={10} />}
        {tab === "info" && <AssetInfo metadata={metadata} isLoading={isLoading} />}
        {tab === "markets" && <AssetMarketTable metadata={metadata} isLoading={isLoading} />}
      </Stack>
      {/* <AssetInfo
           assetSymbol={assetSymbol}
           amountBought={amounts.amountBought.toNumber()}
           amountSold={amounts.amountSold.toNumber()}
           moneyIn={amounts.moneyIn.toNumber()}
           moneyOut={amounts.moneyOut.toNumber()}
           holdings={amounts.holdings.toNumber()}
           costBasis={amounts.costBasis.toNumber()}
           tradeHistory={tradeHistory}
         /> */}
    </Stack>
  )
}

// const [tradeHistory, setTradeHistory] = useState<Transaction[]>([])
// const [amounts, setAmounts] = useState<any>({})

// useEffect(() => {
// readCsv<ParsedTransaction>(filePath, mexcParser).then((tradeHistory) => {
//   const parsedTradeHistory = tradeHistory.filter((x) => x.symbol === assetSymbol)
//   let amountBought = new Decimal(0)
//   let amountSold = new Decimal(0)
//   let moneyIn = new Decimal(0)
//   let moneyOut = new Decimal(0)
//   const frontendTradeHistory: Transaction[] = parsedTradeHistory.map((x) => {
//     if (x.side === "BUY") {
//       amountBought = amountBought.plus(x.amount)
//       moneyIn = moneyIn.plus(x.total)
//     } else {
//       amountSold = amountSold.plus(x.amount)
//       moneyOut = moneyOut.plus(x.total)
//     }
//     return {
//       ...x,
//       amount: x.amount.toNumber(),
//       filledPrice: x.filledPrice.toNumber(),
//       total: x.total.toNumber(),
//     }
//   })
//   const holdings = amountBought.minus(amountSold)
//   const costBasis = moneyIn.div(amountBought)
//   setTradeHistory(frontendTradeHistory)
//   setAmounts({
//     amountBought,
//     amountSold,
//     costBasis,
//     holdings,
//     moneyIn,
//     moneyOut,
//   })
// })
// }, [])
