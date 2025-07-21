import { LanguageRounded, Reddit, Telegram, Twitter } from "@mui/icons-material"
import { Chip, Paper, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { useQuery } from "@tanstack/react-query"
import { getFullExchangeMetadata } from "privatefolio-backend/src/extensions/metadata/coingecko/coingecko-api"
import { isBlockchain, isExchange } from "privatefolio-backend/src/utils/utils"
import React, { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { ActionBlock } from "src/components/ActionBlock"
import { AppLink } from "src/components/AppLink"
import { AssetBlock } from "src/components/AssetBlock"
import { BackButton } from "src/components/BackButton"
import { CoinGeckoIcon } from "src/components/CoinGeckoIcon"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { NavTab } from "src/components/NavTab"
import { PlatformAvatar } from "src/components/PlatformAvatar"
import { SectionTitle } from "src/components/SectionTitle"
import { SubtitleText } from "src/components/SubtitleText"
import { SupportedCheckmark } from "src/components/SupportedCheckmark"
import { Tabs } from "src/components/Tabs"
import { TrustScoreIndicator } from "src/components/TrustScoreIndicator"
import { Platform } from "src/interfaces"
import { PlatformPrefix } from "src/settings"
import { $activeAccount } from "src/stores/account-store"
import { MonoFont, SerifFont } from "src/theme"
import { removePlatformPrefix } from "src/utils/assets-utils"
import { extractRootUrl, formatWebsiteLink, noop } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import FourZeroFourPage from "../404"
import { AssetMarketTable } from "../AssetPage/AssetMarketTable"
import { PlatformAssets } from "./PlatformAssets"

export default function PlatformPage() {
  const { platformId } = useParams<{ platformId: string }>()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "details"

  const [platform, setPlatform] = useState<Platform | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const activeAccount = useStore($activeAccount)
  const rpc = useStore($rpc)

  useEffect(() => {
    if (platform && activeAccount) {
      document.title = `${platform.name} (Platform) - ${activeAccount} - Privatefolio`
    } else if (platformId && activeAccount) {
      document.title = `${platformId} (Platform) - ${activeAccount} - Privatefolio`
    }
  }, [platform, platformId, activeAccount])

  useEffect(() => {
    if (!platformId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    rpc
      .getPlatform(platformId)
      .then(setPlatform)
      .finally(() => {
        setIsLoading(false)
      })
  }, [platformId, rpc])

  const coingeckoId = useMemo(() => {
    if (
      platformId?.startsWith(PlatformPrefix.Chain) ||
      platformId?.startsWith(PlatformPrefix.Exchange)
    ) {
      return removePlatformPrefix(platformId)
    }
  }, [platformId])

  const { data: metadata } = useQuery({
    enabled: !!coingeckoId && platformId?.startsWith(PlatformPrefix.Exchange),
    queryFn: () => {
      if (!coingeckoId) throw new Error("Platform has no coingeckoId")
      return getFullExchangeMetadata(coingeckoId)
    },
    queryKey: ["exchange-full-metadata", coingeckoId],
  })

  if (isLoading) return <DefaultSpinner wrapper />
  if (!platform) return <FourZeroFourPage type="Platform" show />

  const { name, image: logoUrl } = platform

  return (
    <Stack component="main" gap={2}>
      <BackButton sx={{ marginLeft: 1 }} fallback="../platforms">
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
          <PlatformAvatar src={logoUrl} alt={name} size="large" />
          <Stack>
            <Typography variant="h6" fontFamily={SerifFont} sx={{ marginBottom: -0.5 }}>
              <span>{name}</span> <SupportedCheckmark extensions={platform?.extensionsIds} />
            </Typography>
            <SubtitleText>{platform.id}</SubtitleText>
          </Stack>
        </Stack>
        <Stack gap={6} direction="row">
          {isExchange(platform) && typeof platform.coingeckoTrustRank === "number" && (
            <div>
              <SectionTitle>Rank</SectionTitle>
              <Typography fontFamily={MonoFont} variant="body2" paddingTop={0.5}>
                #{platform.coingeckoTrustRank}
              </Typography>
            </div>
          )}
          {isExchange(platform) && typeof platform.coingeckoTrustScore === "number" && (
            <div>
              <SectionTitle>Trust Score</SectionTitle>
              <Stack alignItems="center" paddingTop={0.5}>
                <TrustScoreIndicator score={platform.coingeckoTrustScore} />
              </Stack>
            </div>
          )}
          <div>
            <SectionTitle>Type</SectionTitle>
            <ActionBlock action={isExchange(platform) ? "Exchange" : "Blockchain"} size="small" />
          </div>
        </Stack>
      </Stack>

      <Stack>
        <Tabs value={tab} defaultValue={tab}>
          <NavTab value="details" to="?tab=details" label="Details" />
          {isBlockchain(platform) && <NavTab value="assets" to="?tab=assets" label="Assets" />}
          {isExchange(platform) && <NavTab value="markets" to="?tab=markets" label="Markets" />}
        </Tabs>

        {tab === "details" && (
          <Paper sx={{ paddingX: 2, paddingY: 1 }}>
            <Typography variant="body2" component="div">
              <Stack spacing={2}>
                <div>
                  <SectionTitle>Links</SectionTitle>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {"url" in platform && platform.url && (
                      <Chip
                        href={platform.url}
                        component={AppLink}
                        sx={{ borderRadius: 12 }}
                        onClick={() => {
                          //
                        }}
                        label={extractRootUrl(platform.url)}
                        icon={<LanguageRounded fontSize="small" />}
                      />
                    )}
                    {coingeckoId && (
                      <Chip
                        href={`https://coingecko.com/en/${isBlockchain(platform) ? "chains" : "exchanges"}/${coingeckoId}`}
                        component={AppLink}
                        sx={{ borderRadius: 12 }}
                        onClick={() => {
                          //
                        }}
                        label={coingeckoId}
                        icon={<CoinGeckoIcon height="1rem" width="1.5rem" />}
                      />
                    )}
                    {coingeckoId && isBlockchain(platform) && (
                      <Chip
                        href={`https://www.coingecko.com/en/all-cryptocurrencies?filter_asset_platform=${coingeckoId}`}
                        component={AppLink}
                        sx={{ borderRadius: 12 }}
                        onClick={() => {
                          //
                        }}
                        label={`assets of ${coingeckoId}`}
                        icon={<CoinGeckoIcon height="1rem" width="1.5rem" />}
                      />
                    )}
                    {metadata && (
                      <>
                        {metadata.reddit_url && (
                          <Chip
                            href={metadata.reddit_url}
                            component={AppLink}
                            sx={{ borderRadius: 12 }}
                            onClick={noop}
                            label={formatWebsiteLink(
                              metadata.reddit_url.replace("reddit.com/", "")
                            )}
                            icon={<Reddit sx={{ height: "1rem !important" }} />}
                          />
                        )}
                        {metadata.twitter_handle && (
                          <Chip
                            href={`https://twitter.com/${metadata.twitter_handle}`}
                            component={AppLink}
                            sx={{ borderRadius: 12 }}
                            onClick={noop}
                            label={metadata.twitter_handle}
                            icon={<Twitter sx={{ height: "1rem !important" }} />}
                          />
                        )}
                        {metadata.telegram_url && (
                          <Chip
                            href={`https://t.me/${metadata.telegram_url}`}
                            component={AppLink}
                            sx={{ borderRadius: 12 }}
                            onClick={noop}
                            label={metadata.telegram_url}
                            icon={<Telegram sx={{ height: "1rem !important" }} />}
                          />
                        )}
                      </>
                    )}
                  </Stack>
                </div>
                {metadata && metadata.description && (
                  <div>
                    <SectionTitle>Description</SectionTitle>
                    <span>{metadata.description}</span>
                  </div>
                )}
                {isExchange(platform) && platform.year && (
                  <div>
                    <SectionTitle>Established</SectionTitle>
                    <Typography fontFamily={MonoFont} variant="inherit">
                      {platform.year}
                    </Typography>
                  </div>
                )}
                {isExchange(platform) && platform.country && (
                  <div>
                    <SectionTitle>Country</SectionTitle>
                    <span>{platform.country}</span>
                  </div>
                )}
                {metadata && (metadata.public_notice || metadata.alert_notice) && (
                  <div>
                    <SectionTitle>Notices</SectionTitle>
                    <Stack gap={1}>
                      {metadata.public_notice && (
                        <Typography variant="inherit" color="text.secondary">
                          Public: {metadata.public_notice}
                        </Typography>
                      )}
                      {metadata.alert_notice && (
                        <Typography variant="inherit" color="warning.main">
                          Alert: {metadata.alert_notice}
                        </Typography>
                      )}
                    </Stack>
                  </div>
                )}
                {isBlockchain(platform) && platform.chainId && (
                  <div>
                    <SectionTitle>Chain Id</SectionTitle>
                    <IdentifierBlock
                      id={platform.chainId.toString()}
                      label={platform.chainId}
                      size="small"
                      href={`https://chainlist.org/chain/${platform.chainId}`}
                      linkText="View on Chainlist"
                    />
                  </div>
                )}
                {isBlockchain(platform) && platform.nativeCoinId && (
                  <div>
                    <SectionTitle>Native Asset</SectionTitle>
                    <AssetBlock id={platform.nativeCoinId} />
                  </div>
                )}
                {metadata && metadata.coins && (
                  <div>
                    <SectionTitle>Coins</SectionTitle>
                    <Typography fontFamily={MonoFont} variant="inherit">
                      {metadata.coins.toLocaleString()}
                    </Typography>
                  </div>
                )}
                {metadata && metadata.pairs && (
                  <div>
                    <SectionTitle>Markets</SectionTitle>
                    <Typography fontFamily={MonoFont} variant="inherit">
                      {metadata.pairs.toLocaleString()}
                    </Typography>
                  </div>
                )}
              </Stack>
            </Typography>
          </Paper>
        )}
        {tab === "assets" && isBlockchain(platform) && <PlatformAssets platformId={platform.id} />}
        {tab === "markets" && (
          <AssetMarketTable tickers={metadata?.tickers} isLoading={isLoading} />
        )}
      </Stack>
    </Stack>
  )
}
