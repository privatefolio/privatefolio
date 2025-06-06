import { Chip, Stack, TableCell, TableRow, Tooltip, Typography } from "@mui/material"
import React, { useState } from "react"
import { ActionBlock } from "src/components/ActionBlock"
import { ExtensionBlock } from "src/components/ExtensionBlock"
import { GitHubUserBlock } from "src/components/GitHubUserBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { Truncate } from "src/components/Truncate"
import { RichExtension } from "src/interfaces"
import { getFilterValueLabel } from "src/stores/metadata-store"
import { MonoFont } from "src/theme"
import { TableRowComponentProps } from "src/utils/table-utils"

const platformsToShow = 2

export function ExtensionTableRow(props: TableRowComponentProps<RichExtension>) {
  const {
    row,
    relativeTime: _relativeTime,
    headCells: _headCells,
    isMobile: _isMobile,
    isTablet: _isTablet,
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

  // TODO: add mobile view

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
