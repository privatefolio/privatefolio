import { Stack, TableCell, TableRow, Typography } from "@mui/material"
import React from "react"
import { AmountBlock } from "src/components/AmountBlock"
import { AssetBlock } from "src/components/AssetBlock"
import { CaptionText } from "src/components/CaptionText"
import { PlatformBlock } from "src/components/PlatformBlock"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"

import { Balance } from "../../interfaces"
import { TableRowComponentProps } from "../../utils/table-utils"

export function NetworthTableRow(props: TableRowComponentProps<Balance>) {
  const {
    row,
    isTablet,
    headCells,
    isMobile: _isMobile,
    relativeTime: _relativeTime,
    ...rest
  } = props
  const { assetId, balance, price, value } = row

  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell colSpan={Math.round(headCells.length / 2)} variant="clickable">
          <AssetBlock
            id={assetId}
            size="medium"
            variant="tablecell"
            secondary={<QuoteAmountBlock amount={price?.value} formatting="price" hideTooltip />}
          />
        </TableCell>
        <TableCell colSpan={Math.floor(headCells.length / 2)} align="right">
          <Stack alignItems="flex-end">
            <Typography variant="body1" component="div">
              <QuoteAmountBlock amount={value} />
            </Typography>
            <CaptionText>
              <AmountBlock amount={balance} />
            </CaptionText>
          </Stack>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow hover {...rest}>
      <TableCell variant="clickable">
        <AssetBlock id={assetId} variant="tablecell" />
      </TableCell>
      <TableCell variant="clickable">
        <PlatformBlock id={getAssetPlatform(assetId)} variant="tablecell" />
      </TableCell>
      <TableCell variant="clickable" align="right">
        <AmountBlock amount={balance} currencyTicker={getAssetTicker(assetId)} />
      </TableCell>
      <TableCell variant="clickable" align="right">
        <QuoteAmountBlock amount={price?.value} formatting="price" />
      </TableCell>
      <TableCell variant="clickable" align="right">
        <QuoteAmountBlock amount={value} />
      </TableCell>
    </TableRow>
  )
}
