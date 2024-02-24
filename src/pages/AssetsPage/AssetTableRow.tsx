import { TableCell, TableRow } from "@mui/material"
import React from "react"
import { AppLink } from "src/components/AppLink"
import { AssetBlock } from "src/components/AssetBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { getAssetPlatform } from "src/utils/assets-utils"

import { Asset } from "../../interfaces"
import { TableRowComponentProps } from "../../utils/table-utils"

export function AssetTableRow(props: TableRowComponentProps<Asset>) {
  const {
    row,
    relativeTime: _relativeTime,
    headCells: _headCells,
    isMobile: _isMobile,
    isTablet: _isTablet,
    ...rest
  } = props
  const { _id: assetId, name } = row

  return (
    <>
      <TableRow hover {...rest}>
        <TableCell variant="clickable">
          <AppLink to={`../asset/${encodeURI(assetId)}`}>
            <AssetBlock asset={assetId} secondary={name} size="medium" />
          </AppLink>
        </TableCell>
        <TableCell>
          <PlatformBlock platform={getAssetPlatform(assetId)} />
        </TableCell>
      </TableRow>
    </>
  )
}
