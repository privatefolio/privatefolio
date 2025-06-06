import { LanguageRounded } from "@mui/icons-material"
import { Chip, Paper, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { isBlockchain, isExchange } from "privatefolio-backend/src/utils/utils"
import React, { useEffect, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { ActionBlock } from "src/components/ActionBlock"
import { BackButton } from "src/components/BackButton"
import { CoinGeckoIcon } from "src/components/CoinGeckoIcon"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { NavTab } from "src/components/NavTab"
import { PlatformAvatar } from "src/components/PlatformAvatar"
import { SectionTitle } from "src/components/SectionTitle"
import { Tabs } from "src/components/Tabs"
import { TrustScoreIndicator } from "src/components/TrustScoreIndicator"
import { Platform } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { MonoFont, SerifFont } from "src/theme"
import { extractRootUrl } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import FourZeroFourPage from "../404"

export default function PlatformPage() {
  const { platformId } = useParams<{ platformId: string }>()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "details"

  const [platform, setPlatform] = useState<Platform | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const activeAccount = useStore($activeAccount)

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
    $rpc
      .get()
      .getPlatform(platformId)
      .then(setPlatform)
      .finally(() => {
        setIsLoading(false)
      })
  }, [platformId])

  if (isLoading) return <DefaultSpinner />
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
              <span>{name}</span>
            </Typography>
            <Typography
              color="text.secondary"
              variant="subtitle2"
              fontWeight={400}
              letterSpacing={0.5}
            >
              {platform.id}
            </Typography>
          </Stack>
        </Stack>
        <Stack gap={6} direction="row" alignItems="center">
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
        </Tabs>

        {tab === "details" && (
          <Paper sx={{ paddingX: 2, paddingY: 1 }}>
            <Typography variant="body2" component="div">
              <Stack spacing={2}>
                <div>
                  <SectionTitle>Links</SectionTitle>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {isExchange(platform) && platform.url && (
                      <Chip
                        href={platform.url}
                        target="_blank"
                        component="a"
                        sx={{ borderRadius: 12 }}
                        onClick={() => {
                          //
                        }}
                        label={extractRootUrl(platform.url)}
                        icon={<LanguageRounded fontSize="small" />}
                      />
                    )}
                    <Chip
                      href={`https://coingecko.com/en/${isBlockchain(platform) ? "chains" : "exchanges"}/${platform.id}`}
                      target="_blank"
                      component="a"
                      sx={{ borderRadius: 12 }}
                      onClick={() => {
                        //
                      }}
                      label={platform.id}
                      icon={<CoinGeckoIcon height="1rem" width="1.5rem" />}
                    />
                    {isBlockchain(platform) && (
                      <Chip
                        href={`https://www.coingecko.com/en/all-cryptocurrencies?filter_asset_platform=${platform.id}`}
                        target="_blank"
                        component="a"
                        sx={{ borderRadius: 12 }}
                        onClick={() => {
                          //
                        }}
                        label={`assets of ${platform.id}`}
                        icon={<CoinGeckoIcon height="1rem" width="1.5rem" />}
                      />
                    )}
                  </Stack>
                </div>
                {isExchange(platform) && platform.year && (
                  <div>
                    <SectionTitle>Established</SectionTitle>
                    <Typography fontFamily={MonoFont} variant="body2" paddingTop={0.5}>
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
                    <span>{platform.nativeCoinId}</span>
                  </div>
                )}
              </Stack>
            </Typography>
          </Paper>
        )}
      </Stack>
    </Stack>
  )
}
