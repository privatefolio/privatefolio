import { TableCell, TableRow } from "@mui/material"
import React from "react"
import { AssetBlock } from "src/components/AssetBlock"
import { Asset } from "src/interfaces"
import { TableRowComponentProps } from "src/utils/table-utils"

export function PlatformAssetTableRow(props: TableRowComponentProps<Asset>) {
  const {
    row,
    headCells: _headCells,
    isMobile: _isMobile,
    isTablet,
    relativeTime: _relativeTime,
    ...rest
  } = props
  const { name, marketCapRank } = row

  if (isTablet)
    return (
      <TableRow hover {...rest}>
        <TableCell variant="clickable">
          <AssetBlock asset={row} size="medium" variant="tablecell" secondary={name} />
        </TableCell>
        <TableCell align="right">{marketCapRank ? `#${marketCapRank}` : "Unknown"}</TableCell>
      </TableRow>
    )

  return (
    <TableRow hover {...rest}>
      <TableCell variant="clickable">
        <AssetBlock asset={row} size="small" variant="tablecell" />
      </TableCell>
      <TableCell>{name}</TableCell>
      <TableCell align="right">{marketCapRank ? `#${marketCapRank}` : "Unknown"}</TableCell>
    </TableRow>
  )
}
