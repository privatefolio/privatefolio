import { GitHub, Language, Reddit, Telegram, Twitter } from "@mui/icons-material"
import {
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material"
import React from "react"
import { AppLink } from "src/components/AppLink"
import { CoinGeckoIcon } from "src/components/CoinGeckoIcon"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { DiscordIcon } from "src/components/DiscordIcon"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TimestampBlock } from "src/components/TimestampBlock"
import { CoingeckoMetadataFull } from "src/interfaces"
import { getBlockExplorerUrl, PlatformPrefix } from "src/settings"
import { getAssetInternalId, getAssetPlatform, getPlatformPrefix } from "src/utils/assets-utils"
import { formatWebsiteLink, noop } from "src/utils/utils"

type AssetDetailsProps = {
  assetId: string
  isLoading: boolean
  metadata?: CoingeckoMetadataFull
}

const descriptionCharLimit = 500

export function AssetDetails(props: AssetDetailsProps) {
  const { metadata, isLoading, assetId } = props

  const [showAllCategories, setShowAllCategories] = React.useState(false)
  const [showFullDescription, setShowFullDescription] = React.useState(false)

  if (isLoading) return <DefaultSpinner wrapper />

  return (
    <Stack gap={2}>
      <Paper sx={{ paddingX: 2, paddingY: 1 }}>
        <Typography variant="body2" component="div">
          <Stack gap={2}>
            {getAssetPlatform(assetId) && (
              <div>
                <SectionTitle>Platform</SectionTitle>
                <PlatformBlock id={getAssetPlatform(assetId)} />
              </div>
            )}
            {getAssetInternalId(assetId) && (
              <div>
                <SectionTitle>
                  {getPlatformPrefix(assetId) === PlatformPrefix.Chain
                    ? "Contract Address"
                    : "Identifier"}
                </SectionTitle>
                <IdentifierBlock
                  id={getAssetInternalId(assetId)!}
                  href={getBlockExplorerUrl(
                    getAssetPlatform(assetId)!,
                    getAssetInternalId(assetId)!,
                    "address"
                  )}
                  linkText={`See on block explorer`}
                  size="small"
                />
              </div>
            )}
            {!!metadata && (
              <>
                {metadata.links && (
                  <div>
                    <SectionTitle>Links</SectionTitle>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                      <Chip
                        href={`https://coingecko.com/en/coins/${metadata.id}`}
                        component={AppLink}
                        sx={{ borderRadius: 12 }}
                        onClick={() => {
                          //
                        }}
                        label={metadata.id}
                        icon={<CoinGeckoIcon height="1rem" width="1.5rem" />}
                      />
                      {metadata.links.homepage && metadata.links.homepage[0] && (
                        <Chip
                          href={metadata.links.homepage[0]}
                          component={AppLink}
                          sx={{ borderRadius: 12 }}
                          onClick={noop}
                          label={formatWebsiteLink(metadata.links.homepage[0])}
                          icon={<Language sx={{ height: "1rem !important" }} />}
                        />
                      )}
                      {metadata.links.twitter_screen_name && (
                        <Chip
                          href={`https://twitter.com/${metadata.links.twitter_screen_name}`}
                          component={AppLink}
                          sx={{ borderRadius: 12 }}
                          onClick={noop}
                          label={metadata.links.twitter_screen_name}
                          icon={<Twitter sx={{ height: "1rem !important" }} />}
                        />
                      )}
                      {metadata.links.subreddit_url && (
                        <Chip
                          href={metadata.links.subreddit_url}
                          component={AppLink}
                          sx={{ borderRadius: 12 }}
                          onClick={noop}
                          label={formatWebsiteLink(
                            metadata.links.subreddit_url.replace("reddit.com/", "")
                          )}
                          icon={<Reddit sx={{ height: "1rem !important" }} />}
                        />
                      )}
                      {metadata.links.telegram_channel_identifier && (
                        <Chip
                          href={`https://t.me/${metadata.links.telegram_channel_identifier}`}
                          component={AppLink}
                          sx={{ borderRadius: 12 }}
                          onClick={noop}
                          label={metadata.links.telegram_channel_identifier}
                          icon={<Telegram sx={{ height: "1rem !important" }} />}
                        />
                      )}
                      {metadata.links.chat_url && metadata.links.chat_url[0] && (
                        <Chip
                          href={metadata.links.chat_url[0]}
                          component={AppLink}
                          sx={{ borderRadius: 12 }}
                          onClick={noop}
                          label={formatWebsiteLink(metadata.links.chat_url[0])}
                          icon={<DiscordIcon height="1rem" />}
                        />
                      )}
                      {metadata.links.repos_url.github && metadata.links.repos_url.github[0] && (
                        <Chip
                          href={metadata.links.repos_url.github[0]}
                          component={AppLink}
                          sx={{ borderRadius: 12 }}
                          onClick={noop}
                          label={formatWebsiteLink(
                            metadata.links.repos_url.github[0].replace("github.com/", "")
                          )}
                          icon={<GitHub sx={{ height: "1rem !important" }} />}
                        />
                      )}
                    </Stack>
                  </div>
                )}
                <div>
                  <SectionTitle>Description</SectionTitle>
                  {!metadata.description.en ? (
                    <span>No description available.</span>
                  ) : (
                    <span>
                      {showFullDescription
                        ? metadata.description.en
                        : metadata.description.en.substring(0, descriptionCharLimit) + "…"}{" "}
                      {metadata.description.en.length > descriptionCharLimit && (
                        <Typography
                          variant="inherit"
                          color="text.secondary"
                          component="span"
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          sx={{
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          {showFullDescription ? "Show less" : "Show more"}
                        </Typography>
                      )}
                    </span>
                  )}
                </div>
                {metadata.categories && metadata.categories.length > 0 && (
                  <div>
                    <SectionTitle>Categories</SectionTitle>
                    <Stack direction="row" gap={1} flexWrap={"wrap"}>
                      {metadata.categories
                        .slice(0, !showAllCategories ? 3 : metadata.categories.length)
                        .map((category) => (
                          <Chip key={category} label={category} size="small" />
                        ))}
                      {!showAllCategories && metadata.categories.length > 3 && (
                        <Chip
                          label={`+${metadata.categories.length - 3} more`}
                          size="small"
                          onClick={() => setShowAllCategories(true)}
                        />
                      )}
                      {showAllCategories && metadata.categories.length > 3 && (
                        <Chip
                          label={"Show less"}
                          size="small"
                          onClick={() => setShowAllCategories(false)}
                        />
                      )}
                    </Stack>
                  </div>
                )}
                {/* Genesis Date */}
                {metadata.genesis_date && (
                  <div>
                    <SectionTitle>Genesis Date</SectionTitle>
                    <TimestampBlock
                      timestamp={new Date(metadata.genesis_date).getTime()}
                      variant="simple"
                    />
                  </div>
                )}
                {/* last_updated */}
                {/* watchlist_portfolio_users */}
                {/* market data */}
                {/* community data */}
                {/* dev data? */}
                {/* tickers */}
                {/* platforms */}
                {/* markets */}
              </>
            )}
          </Stack>
        </Typography>
      </Paper>
      {metadata?.detail_platforms && Object.entries(metadata.detail_platforms).length > 0 && (
        <Paper sx={{ alignSelf: "flex-start", paddingY: 0.5 }}>
          <Table sx={{ width: "fit-content" }} size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 180, width: 220 }}>
                  <SectionTitle>Platform</SectionTitle>
                </TableCell>
                <TableCell sx={{ minWidth: 180, width: 410 }}>
                  <SectionTitle>Contract Address</SectionTitle>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(metadata.detail_platforms).map(([coingeckoId, details]) => {
                if (!details.contract_address) return null

                const platformId = `${PlatformPrefix.Chain}${coingeckoId}`

                return (
                  <TableRow key={coingeckoId}>
                    <TableCell>
                      <PlatformBlock id={platformId} size="small" showSupported />
                    </TableCell>
                    <TableCell>
                      <IdentifierBlock
                        label={details.contract_address}
                        id={details.contract_address}
                        href={getBlockExplorerUrl(platformId, details.contract_address, "address")}
                        linkText={`See on block explorer`}
                        // linkText={`See on ${getBlockExplorerName(platformId)}`}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  )
}
