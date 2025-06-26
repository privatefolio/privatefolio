import { Stack, TableCell, TableRow, Typography } from "@mui/material"
import React from "react"
import { AssetBlock } from "src/components/AssetBlock"
import { CaptionText } from "src/components/CaptionText"
import { PlatformBlock } from "src/components/PlatformBlock"
import { Blockchain } from "src/interfaces"
import { TableRowComponentProps } from "src/utils/table-utils"

interface BlockchainTableRowProps extends TableRowComponentProps<Blockchain> {
  row: Blockchain
}

export function BlockchainTableRow(props: BlockchainTableRowProps) {
  const {
    row,
    headCells: _headCells,
    isTablet,
    isMobile: _isMobile,
    relativeTime: _relativeTime,
    ...rest
  } = props

  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell variant="clickable">
          <PlatformBlock
            variant="tablecell"
            size="medium"
            platform={row}
            secondary={<span>Chain ID: {row.chainId ?? "N/A"}</span>}
          />
        </TableCell>
        <TableCell align="right">
          <Stack alignItems="flex-end">
            {row.nativeCoinId && <CaptionText>Native asset</CaptionText>}
            <AssetBlock id={row.nativeCoinId} size="small" variant="tablecell" showLoading />
          </Stack>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow hover {...rest}>
      <TableCell variant="clickable">
        <PlatformBlock variant="tablecell" platform={row} />
      </TableCell>
      <TableCell variant="clickable">
        <AssetBlock id={row.nativeCoinId} size="small" variant="tablecell" showLoading />
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
