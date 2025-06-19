import { Stack, TableCell, TableRow, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { AppLink } from "src/components/AppLink"
import { CaptionText } from "src/components/CaptionText"
import { ExternalLink } from "src/components/ExternalLink"
import { PlatformBlock } from "src/components/PlatformBlock"
import { TrustScoreIndicator } from "src/components/TrustScoreIndicator"
import { Exchange } from "src/interfaces"
import { $activeAccountPath } from "src/stores/account-store"
import { TableRowComponentProps } from "src/utils/table-utils"
import { extractRootUrl } from "src/utils/utils"

interface ExchangeTableRowProps extends TableRowComponentProps<Exchange> {
  row: Exchange
}

export function ExchangeTableRow({
  row,
  headCells,
  isTablet,
  isMobile: _isMobile,
  relativeTime: _relativeTime,
  ...rest
}: ExchangeTableRowProps) {
  const activeAccountPath = useStore($activeAccountPath)

  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell colSpan={headCells.length} variant="clickable">
          <AppLink to={`${activeAccountPath}/platform/${row.id}`}>
            <Stack gap={1} direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack>
                <PlatformBlock variant="tablecell" platform={row} />
                {row.url && <CaptionText>{extractRootUrl(row.url)}</CaptionText>}
              </Stack>
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
            </Stack>
          </AppLink>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow hover {...rest}>
      <TableCell variant="clickable">
        <PlatformBlock variant="tablecell" platform={row} />
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
