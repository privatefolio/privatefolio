import { Chip, Stack, TableCell, TableRow, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useState } from "react"
import { ActionBlock } from "src/components/ActionBlock"
import { AppLink } from "src/components/AppLink"
import { CaptionText } from "src/components/CaptionText"
import { ExtensionBlock } from "src/components/ExtensionBlock"
import { GitHubUserBlock } from "src/components/GitHubUserBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { Truncate } from "src/components/Truncate"
import { RichExtension } from "src/interfaces"
import { $activeAccountPath } from "src/stores/account-store"
import { getFilterValueLabel } from "src/stores/metadata-store"
import { MonoFont } from "src/theme"
import { TableRowComponentProps } from "src/utils/table-utils"

const platformsToShow = 2

export function ExtensionTableRow(props: TableRowComponentProps<RichExtension>) {
  const {
    row,
    relativeTime: _relativeTime,
    headCells,
    isMobile: _isMobile,
    isTablet,
    ...rest
  } = props

  const {
    extensionName,
    platforms,
    authorGithub,
    extensionVersion,
    extensionType,
    description,
    priceUsd,
  } = row

  const [showAllPlatforms, setShowAllPlatforms] = useState(false)
  const activeAccountPath = useStore($activeAccountPath)

  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell colSpan={headCells.length} variant="clickable">
          <AppLink to={`${activeAccountPath}/extension/${row.id}`}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
              <Stack gap={0.5} marginY={0.5} flexGrow={1} minWidth={0}>
                <ExtensionBlock
                  variant="tablecell"
                  label={<Truncate sx={{ maxWidth: 220 }}>{extensionName}</Truncate>}
                  extension={row}
                />
                <CaptionText>
                  <Truncate>{description}</Truncate>
                </CaptionText>
              </Stack>
              <Stack alignItems="flex-end" gap={0.5} sx={{ minWidth: 120 }}>
                <ActionBlock action={getFilterValueLabel(extensionType)} />
                <CaptionText fontFamily={MonoFont}>
                  {priceUsd && priceUsd > 0 ? `$${priceUsd.toFixed(2)}` : "Free"}
                </CaptionText>
              </Stack>
            </Stack>
          </AppLink>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow hover {...rest}>
      <TableCell variant="clickable">
        <ExtensionBlock
          variant="tablecell"
          label={<Truncate sx={{ maxWidth: 118 }}>{extensionName}</Truncate>}
          extension={row}
        />
      </TableCell>
      <TableCell>
        <Tooltip title={description}>
          <Truncate>{description}</Truncate>
        </Tooltip>
      </TableCell>
      <TableCell>
        <ActionBlock action={getFilterValueLabel(extensionType)} />
      </TableCell>
      <TableCell>{extensionVersion}</TableCell>
      <TableCell>
        <GitHubUserBlock username={authorGithub} size="small" />
      </TableCell>
      <TableCell>
        <Stack gap={1} direction="row" flexWrap="wrap">
          {!!platforms &&
            platforms
              .slice(0, !showAllPlatforms ? platformsToShow : platforms.length)
              .map((platform) => <PlatformBlock key={platform.id} platform={platform} />)}
          {!showAllPlatforms && !!platforms?.length && platforms.length > platformsToShow && (
            <Chip
              label={`+${platforms.length - platformsToShow} more`}
              size="small"
              onClick={() => setShowAllPlatforms(true)}
            />
          )}
          {showAllPlatforms && !!platforms?.length && platforms.length > platformsToShow && (
            <Chip label={"Show less"} size="small" onClick={() => setShowAllPlatforms(false)} />
          )}
        </Stack>
      </TableCell>
      <TableCell align="right">
        {priceUsd && priceUsd > 0 ? (
          <Typography variant="inherit" fontFamily={MonoFont}>
            ${priceUsd.toFixed(2)}
          </Typography>
        ) : (
          <Typography variant="inherit" color="text.secondary" fontFamily={MonoFont}>
            Free
          </Typography>
        )}
      </TableCell>
    </TableRow>
  )
}
