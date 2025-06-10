import { TableCell, TableRow, Typography } from "@mui/material"
import React from "react"
import { ForeignAssetBlock } from "src/components/ForeignAssetBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { Blockchain } from "src/interfaces"

interface BlockchainTableRowProps {
  row: Blockchain
}

export function BlockchainTableRow({ row }: BlockchainTableRowProps) {
  return (
    <TableRow>
      <TableCell variant="clickable">
        <PlatformBlock variant="tablecell" platform={row} />
      </TableCell>
      <TableCell variant="clickable">
        <ForeignAssetBlock coingeckoId={row.nativeCoinId} size="small" variant="tablecell" />
      </TableCell>
      <TableCell align="right">
        {row.chainId || (
          <Typography color="text.secondary" variant="inherit">
            N/A
          </Typography>
        )}
      </TableCell>
    </TableRow>
  )
}
