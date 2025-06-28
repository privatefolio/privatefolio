import { Stack, TableCell, TableRow, Typography } from "@mui/material"
import React from "react"
import { CaptionText } from "src/components/CaptionText"
import { ExternalLink } from "src/components/ExternalLink"
import { PlatformBlock } from "src/components/PlatformBlock"
import { TrustScoreIndicator } from "src/components/TrustScoreIndicator"
import { Exchange } from "src/interfaces"
import { TableRowComponentProps } from "src/utils/table-utils"
import { extractRootUrl } from "src/utils/utils"

interface ExchangeTableRowProps extends TableRowComponentProps<Exchange> {
  row: Exchange
}

export function ExchangeTableRow({
  row,
  headCells: _headCells,
  isTablet,
  isMobile: _isMobile,
  relativeTime: _relativeTime,
  ...rest
}: ExchangeTableRowProps) {
  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell variant="clickable">
          <PlatformBlock
            variant="tablecell"
            platform={row}
            size="medium"
            secondary={!!row.url && <CaptionText>{extractRootUrl(row.url)}</CaptionText>}
            showSupported
          />
        </TableCell>
        <TableCell align="right">
          <Stack alignItems="flex-end" sx={{ fontSize: "0.75rem", minWidth: 120 }}>
            <Stack direction="row" alignItems="center" gap={1}>
              {row.coingeckoTrustRank && (
                <Typography color="text.secondary" variant="inherit">
                  #{row.coingeckoTrustRank}
                </Typography>
              )}
            </Stack>
            <CaptionText>
              {row.country && row.year
                ? `${row.country} • ${row.year}`
                : row.country || row.year || "Unknown"}{" "}
            </CaptionText>
          </Stack>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow hover {...rest}>
      <TableCell variant="clickable">
        <PlatformBlock variant="tablecell" platform={row} showSupported />
      </TableCell>
      <TableCell>
        {row.url ? (
          <ExternalLink href={row.url}>{extractRootUrl(row.url)}</ExternalLink>
        ) : (
          <Typography color="text.secondary" variant="inherit">
            Unknown
          </Typography>
        )}
      </TableCell>
      <TableCell>
        {row.country || (
          <Typography color="text.secondary" variant="inherit">
            Unknown
          </Typography>
        )}
      </TableCell>
      <TableCell>
        {row.year || (
          <Typography color="text.secondary" variant="inherit">
            Unknown
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <TrustScoreIndicator score={row.coingeckoTrustScore} />
      </TableCell>
      <TableCell align="right">
        {row.coingeckoTrustRank || (
          <Typography color="text.secondary" variant="inherit">
            Unknown
          </Typography>
        )}
      </TableCell>
    </TableRow>
  )
}
