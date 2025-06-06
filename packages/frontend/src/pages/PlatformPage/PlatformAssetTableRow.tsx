import { TableCell, TableRow } from "@mui/material"
import React from "react"
import { AppLink } from "src/components/AppLink"
import { ForeignAssetBlock } from "src/components/ForeignAssetBlock"
import { Asset } from "src/interfaces"
import { TableRowComponentProps } from "src/utils/table-utils"

export function PlatformAssetTableRow(props: TableRowComponentProps<Asset>) {
  const {
    row,
    headCells: _headCells,
    isMobile: _isMobile,
    isTablet: _isTablet,
    relativeTime: _relativeTime,
    ...rest
  } = props
  const { id: assetId, name, marketCapRank } = row

  return (
    <TableRow hover {...rest}>
      <TableCell variant="clickable">
        <AppLink to={`../asset/${encodeURI(assetId)}`}>
          <ForeignAssetBlock asset={row} size="small" variant="tablecell" />
        </AppLink>
      </TableCell>
      <TableCell>{name}</TableCell>
      <TableCell align="right">{marketCapRank ? `#${marketCapRank}` : "Unknown"}</TableCell>
    </TableRow>
  )
}
