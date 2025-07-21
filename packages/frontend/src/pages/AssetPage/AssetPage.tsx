import { StarOutlineRounded, StarRounded } from "@mui/icons-material"
import { IconButton, Skeleton, Stack, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { useQuery } from "@tanstack/react-query"
import { getFullMetadata } from "privatefolio-backend/build/src/extensions/metadata/coingecko/coingecko-api"
import React, { useCallback, useEffect, useMemo, useState } from "react"
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
import { useAsset } from "src/hooks/useAsset"
import { Balance } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"
import { $rpc } from "src/workers/remotes"

import { AssetAvatar } from "../../components/AssetAvatar"
import { $assetMap, $filterOptionsMap } from "../../stores/metadata-store"
import { SerifFont } from "../../theme"
import FourZeroFourPage from "../404"
import { AuditLogActions } from "../AuditLogsPage/AuditLogActions"
import { AuditLogTable } from "../AuditLogsPage/AuditLogTable"
import { TradeActions } from "../TradesPage/TradeActions"
import { TradeTable } from "../TradesPage/TradeTable"
import { TransactionActions } from "../TransactionsPage/TransactionActions"
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

  const filterMap = useStore($filterOptionsMap)

  const [balances, setBalances] = useState<Balance[]>()

  const activeAccount = useStore($activeAccount)
  const rpc = useStore($rpc)

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

  const [asset, isAssetLoading] = useAsset(assetId)

  const { data: metadata, isLoading: isMetadataLoading } = useQuery({
    enabled: !!asset?.coingeckoId,
    queryFn: () => {
      if (!asset?.coingeckoId) throw new Error("Asset has no coingeckoId")
      return getFullMetadata(asset.coingeckoId)
    },
    queryKey: ["asset-full-metadata", asset?.coingeckoId],
  })

  const isLoading = isAssetLoading || isMetadataLoading

  const handleStarClick = useCallback(() => {
    if (!asset) return
    $assetMap.setKey(asset.id, { ...asset, favorite: !asset.favorite })
    rpc.patchAsset(activeAccount, asset.id, { favorite: !asset.favorite })
  }, [activeAccount, asset, rpc])

  if (!filterMap.assetId) return <DefaultSpinner wrapper />
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
            <Stack direction="row" alignItems="flex-end" gap={0.25}>
              <Typography variant="h6" fontFamily={SerifFont} sx={{ marginBottom: -0.5 }}>
                <span>{getAssetTicker(assetId)}</span>
              </Typography>
              <Tooltip
                title={
                  asset?.firstOwnedAt
                    ? "Assets you own are automatically favorited"
                    : asset?.favorite
                      ? "Remove from favorites"
                      : "Add to favorites"
                }
              >
                <span>
                  <IconButton
                    size="small"
                    sx={{ marginY: -0.5 }}
                    onClick={handleStarClick}
                    disabled={!!asset?.firstOwnedAt}
                  >
                    {asset?.favorite || !!asset?.firstOwnedAt ? (
                      <StarRounded fontSize="small" />
                    ) : (
                      <StarOutlineRounded fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
            <SubtitleText>{asset?.name || metadata?.name}</SubtitleText>
          </Stack>
        </Stack>
        <Stack
          gap={6}
          direction="row"
          flexWrap="wrap"
          sx={{
            "& > div": { minHeight: 51.45 },
          }}
        >
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
                <span>{metadata.market_cap_rank ? `#${metadata.market_cap_rank}` : "Unknown"}</span>
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
              {!!metadata.market_data?.market_cap?.usd && (
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
      <div>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
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
          {tab === "balance" && <QuoteCurrencyToggle />}
          {tab === "trades" && <TradeActions />}
          {tab === "transactions" && <TransactionActions />}
          {tab === "audit-logs" && <AuditLogActions />}
        </Stack>
        {tab === "details" && <AssetDetails metadata={metadata} isLoading={isLoading} />}
        {tab === "price-history" && <AssetPriceHistory asset={asset} />}
        {tab === "markets" && (
          <AssetMarketTable tickers={metadata?.tickers} isLoading={isLoading} />
        )}
        {tab === "trades" && <TradeTable assetId={assetId} defaultRowsPerPage={10} />}
        {tab === "balance" && <AssetBalanceHistory assetId={assetId} />}
        {tab === "transactions" && <TransactionTable assetId={assetId} defaultRowsPerPage={10} />}
        {tab === "audit-logs" && <AuditLogTable assetId={assetId} defaultRowsPerPage={10} />}
      </div>
    </Stack>
  )
}
