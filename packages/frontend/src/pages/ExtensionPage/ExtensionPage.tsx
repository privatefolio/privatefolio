import {
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { ActionBlock } from "src/components/ActionBlock"
import { BackButton } from "src/components/BackButton"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { ExtensionAvatar } from "src/components/ExtensionAvatar"
import { GitHubUserBlock } from "src/components/GitHubUserBlock"
import { NavTab } from "src/components/NavTab"
import { PlatformBlock } from "src/components/PlatformBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { Tabs } from "src/components/Tabs"
import { TimestampBlock } from "src/components/TimestampBlock"
import { RichExtension } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { getFilterValueLabel } from "src/stores/metadata-store"
import { MonoFont, SerifFont } from "src/theme"
import { prettifyUrl, resolveUrl } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import FourZeroFourPage from "../404"

const defaultTab = "details"

export default function ExtensionPage() {
  const { extensionId } = useParams<{ extensionId: string }>()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || defaultTab

  const [extension, setExtension] = useState<RichExtension | null | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    if (extension && activeAccount) {
      document.title = `${extension.extensionName} (Extension) - ${activeAccount} - Privatefolio`
    } else if (extensionId && activeAccount) {
      document.title = `${extensionId} (Extension)- ${activeAccount} - Privatefolio`
    }
  }, [extension, extensionId, activeAccount])

  useEffect(() => {
    if (!extensionId) {
      setIsLoading(false)
      setExtension(null)
      return
    }

    setIsLoading(true)
    $rpc
      .get()
      .getExtension(extensionId)
      .then((data) => {
        setExtension(data ?? null)
      })
      .catch(() => {
        setExtension(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [extensionId])

  const HowToComponent = useMemo(() => {
    if (!extension?.howTo) return null
    return lazy(() => import(/* @vite-ignore */ extension.howTo!))
  }, [extension?.howTo])

  if (isLoading) return <DefaultSpinner />
  if (!extension) return <FourZeroFourPage show type="Extension" />

  const {
    extensionName,
    extensionLogoUrl,
    extensionVersion,
    authorGithub,
    extensionType,
    description,
    platforms,
    publishedAt,
    updatedAt,
    priceUsd,
  } = extension

  return (
    <Stack component="main" gap={2}>
      <BackButton sx={{ marginLeft: 1 }} fallback="../extensions">
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
          <ExtensionAvatar src={resolveUrl(extensionLogoUrl)} alt={extensionName} size="large" />
          <Stack>
            <Typography variant="h6" fontFamily={SerifFont} sx={{ marginBottom: -0.5 }}>
              <span>{extensionName}</span>
            </Typography>
            <Typography
              color="text.secondary"
              variant="subtitle2"
              fontWeight={400}
              letterSpacing={0.5}
            >
              {extension.id}
            </Typography>
          </Stack>
        </Stack>
        <Stack gap={6} direction="row">
          <div>
            <SectionTitle>Price</SectionTitle>
            <Typography fontFamily={MonoFont} variant="body2" paddingTop={0.5}>
              {priceUsd && priceUsd > 0 ? `$${priceUsd.toFixed(2)}` : "Free"}
            </Typography>
          </div>
          <div>
            <SectionTitle>Version</SectionTitle>
            <Typography fontFamily={MonoFont} variant="body2" paddingTop={0.5}>
              {extensionVersion}
            </Typography>
          </div>
          <div>
            <SectionTitle>Author</SectionTitle>
            <GitHubUserBlock username={authorGithub} size="small" />
          </div>
          <div>
            <SectionTitle>Type</SectionTitle>
            <ActionBlock action={getFilterValueLabel(extensionType)} size="small" />
          </div>
        </Stack>
      </Stack>

      <Stack>
        <Tabs value={tab} defaultValue={defaultTab}>
          <NavTab value="details" to="?tab=details" label="Details" />
          {extension.howTo && <NavTab value="how-to" to="?tab=how-to" label="How to use" />}
          {extension.sources && extension.sources.length > 0 && (
            <NavTab value="source" to="?tab=source" label="Source Code" />
          )}
        </Tabs>

        {tab === "details" && (
          <Paper sx={{ paddingX: 2, paddingY: 1 }}>
            <Typography variant="body2" component="div">
              <Stack spacing={2}>
                <div>
                  <SectionTitle>Description</SectionTitle>
                  <span>{description}</span>
                </div>
                <div>
                  <SectionTitle>Published</SectionTitle>
                  <TimestampBlock timestamp={publishedAt} variant="simple" />
                </div>
                <div>
                  <SectionTitle>Last Updated</SectionTitle>
                  <TimestampBlock timestamp={updatedAt} variant="simple" />
                </div>
                {platforms && platforms.length > 0 && (
                  <div>
                    <SectionTitle>Supported Platforms</SectionTitle>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {platforms.map((platform) => (
                        <PlatformBlock key={platform.id} platform={platform} />
                      ))}
                    </Stack>
                  </div>
                )}
              </Stack>
            </Typography>
          </Paper>
        )}

        {tab === "source" && (
          <>
            {extension.sources && extension.sources.length > 0 ? (
              <Paper sx={{ alignSelf: "flex-start", paddingY: 0.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 300, width: 400 }}>
                        <SectionTitle>Link</SectionTitle>
                      </TableCell>
                      <TableCell sx={{ minWidth: 150, width: 200 }}>
                        <SectionTitle>Tags</SectionTitle>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {extension.sources.map((source, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Link
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                          >
                            {prettifyUrl(source.url)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {source.tags && source.tags.length > 0 ? source.tags.join(", ") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            ) : (
              <Paper sx={{ paddingX: 2, paddingY: 1 }}>
                <Typography>Source code not available.</Typography>
              </Paper>
            )}
          </>
        )}

        {tab === "how-to" && HowToComponent && (
          <Suspense fallback={<DefaultSpinner />}>
            <HowToComponent />
          </Suspense>
        )}
      </Stack>
    </Stack>
  )
}
