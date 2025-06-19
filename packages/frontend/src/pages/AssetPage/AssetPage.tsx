import { Skeleton, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { getFullMetadata } from "privatefolio-backend/build/src/extensions/metadata/coingecko/coingecko-asset-api"
import React, { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { AmountBlock } from "src/components/AmountBlock"
import { BackButton } from "src/components/BackButton"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { NavTab } from "src/components/NavTab"
import { PlatformBlock } from "src/components/PlatformBlock"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { QuoteCurrencyToggle } from "src/components/QuoteCurrencyToggle"
import { SectionTitle } from "src/components/SectionTitle"
import { SubtitleText } from "src/components/SubtitleText"
import { Tabs } from "src/components/Tabs"
import { UserWalletIcon } from "src/components/UserWalletIcon"
import { Balance, CoingeckoMetadataFull, MyAsset } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"
import { $rpc } from "src/workers/remotes"

import { AssetAvatar } from "../../components/AssetAvatar"
import { $assetMap, $filterOptionsMap } from "../../stores/metadata-store"
import { SerifFont } from "../../theme"
import FourZeroFourPage from "../404"
import { AuditLogTable } from "../AuditLogsPage/AuditLogTable"
import { TradeTable } from "../TradesPage/TradeTable"
import { TransactionTable } from "../TransactionsPage/TransactionTable"
import { AssetBalanceHistory } from "./AssetBalanceHistory"
import { AssetDetails } from "./AssetDetails"
import { AssetMarketTable } from "./AssetMarketTable"
import { AssetPriceHistory } from "./AssetPriceHistory"

export default function AssetPage() {
  const params = useParams()
  const assetId = params.assetId // ?.toLocaleUpperCase()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "details"
  const assetMap = useStore($assetMap)

  const filterMap = useStore($filterOptionsMap)

  const [balances, setBalances] = useState<Balance[]>()

  const activeAccount = useStore($activeAccount)
  const rpc = useStore($rpc)

  const [asset, setAsset] = useState<MyAsset | undefined>()

  useEffect(() => {
    document.title = `${getAssetTicker(assetId)} (Asset) - ${activeAccount} - Privatefolio`
  }, [assetId, activeAccount])

  useEffect(() => {
    rpc.getBalancesAt(activeAccount).then((balances) => {
      // fetch no longer accurate
      if (activeAccount !== $activeAccount.get()) return
      setBalances(balances)
    })
  }, [rpc, activeAccount])

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

    if (assetMap[assetId]) {
      setAsset(assetMap[assetId])
      if (!assetMap[assetId].coingeckoId) return
      getFullMetadata(assetMap[assetId].coingeckoId).then(setMetadata)
      return
    }

    setLoading(true)
    rpc
      .getAsset(activeAccount, assetId)
      .then((x) => {
        setAsset(x)
        return x?.coingeckoId ? getFullMetadata(x.coingeckoId) : null
      })
      .then(setMetadata)
      .finally(() => setLoading(false))
  }, [activeAccount, assetId, assetMap, rpc])

  if (!filterMap.assetId) return <DefaultSpinner />
  if (!assetId) return <FourZeroFourPage show type="Asset" />

  return (
    <Stack component="main" gap={2}>
      <BackButton sx={{ marginLeft: 1 }} fallback="../assets">
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
          <AssetAvatar
            size="large"
            src={asset?.logoUrl || metadata?.image.large}
            alt={getAssetTicker(assetId)}
          />
          <Stack>
            <Typography variant="h6" fontFamily={SerifFont} sx={{ marginBottom: -0.5 }}>
              <span>{getAssetTicker(assetId)}</span>
            </Typography>
            <SubtitleText>{asset?.name || metadata?.name}</SubtitleText>
          </Stack>
        </Stack>
        <Stack gap={6} direction="row" flexWrap="wrap">
          {getAssetPlatform(assetId) && getAssetPlatform(assetId) !== "coingecko" && (
            <div>
              <SectionTitle>Platform</SectionTitle>
              <PlatformBlock id={getAssetPlatform(assetId)} />
            </div>
          )}
          {metadata && (
            <>
              <div>
                <SectionTitle>Rank</SectionTitle>
                <span>#{metadata.market_cap_rank}</span>
              </div>
              {metadata.market_data?.current_price?.usd && (
                <div>
                  <SectionTitle>Current Price</SectionTitle>
                  <QuoteAmountBlock
                    amount={metadata.market_data.current_price.usd}
                    formatting="price"
                  />
                </div>
              )}
              {metadata.market_data?.market_cap?.usd && (
                <div>
                  <SectionTitle>Market Cap</SectionTitle>
                  <QuoteAmountBlock amount={metadata.market_data.market_cap.usd} />
                </div>
              )}
            </>
          )}
          <div>
            <SectionTitle>
              <UserWalletIcon /> Balance
            </SectionTitle>
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
            <SectionTitle>
              <UserWalletIcon /> Value
            </SectionTitle>
            {!balances ? (
              <Skeleton width="100%" />
            ) : (
              <QuoteAmountBlock amount={balance?.value || 0} />
            )}
          </div>
        </Stack>
      </Stack>
      <Stack>
        <Tabs value={tab} defaultValue={tab}>
          <NavTab value="details" to={`?tab=details`} label="Details" />
          <NavTab value="markets" to={`?tab=markets`} label="Markets" />
          <NavTab value="price-history" to={`?tab=price-history`} label="Price history" />
          <NavTab
            value="balance"
            to={`?tab=balance`}
            label={
              <span>
                <UserWalletIcon /> Balance history
              </span>
            }
          />
          <NavTab
            value="trades"
            to={`?tab=trades`}
            label={
              <span>
                <UserWalletIcon /> Trades
              </span>
            }
          />
          <NavTab
            value="transactions"
            to={`?tab=transactions`}
            label={
              <span>
                <UserWalletIcon /> Transactions
              </span>
            }
          />
          <NavTab
            value="audit-logs"
            to={`?tab=audit-logs`}
            label={
              <span>
                <UserWalletIcon /> Audit logs
              </span>
            }
          />
        </Tabs>
        {tab === "details" && <AssetDetails metadata={metadata} isLoading={isLoading} />}
        {tab === "price-history" && <AssetPriceHistory asset={asset} />}
        {tab === "markets" && <AssetMarketTable metadata={metadata} isLoading={isLoading} />}
        {tab === "trades" && <TradeTable assetId={assetId} defaultRowsPerPage={10} />}
        {tab === "balance" && (
          <AssetBalanceHistory assetId={assetId} extraSettings={<QuoteCurrencyToggle />} />
        )}
        {tab === "transactions" && <TransactionTable assetId={assetId} defaultRowsPerPage={10} />}
        {tab === "audit-logs" && <AuditLogTable assetId={assetId} defaultRowsPerPage={10} />}
      </Stack>
    </Stack>
  )
}
