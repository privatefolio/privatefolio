import { TableCell, TableRow, Typography } from "@mui/material"
import React from "react"
import { ExternalLink } from "src/components/ExternalLink"
import { PlatformBlock } from "src/components/PlatformBlock"
import { TrustScoreIndicator } from "src/components/TrustScoreIndicator"
import { Exchange } from "src/interfaces"
import { extractRootUrl } from "src/utils/utils"

interface ExchangeTableRowProps {
  row: Exchange
}

export function ExchangeTableRow({ row }: ExchangeTableRowProps) {
  return (
    <TableRow>
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
