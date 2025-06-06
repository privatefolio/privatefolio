import { TableCell, TableRow, Typography } from "@mui/material"
import React from "react"
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
      <TableCell>{row.nativeCoinId}</TableCell>
      {/* <TableCell variant="clickable">
        <IdentifierBlock
          variant="tablecell"
          label={row.nativeCoinId}
          id={row.nativeCoinId}
          avatar={<AssetAvatar src={row.image} alt={row.nativeCoinId} size="small" />}
          size="small"
          href={`../asset/${row.id}`}
          linkText={`View asset`}
        />
        TODO
      </TableCell> */}
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
