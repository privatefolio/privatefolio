import { Stack, TableCell, TableRow, Typography } from "@mui/material"
import React from "react"
import { AmountBlock } from "src/components/AmountBlock"
import { AppLink } from "src/components/AppLink"
import { MyAssetBlock } from "src/components/MyAssetBlock"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { getAssetTicker } from "src/utils/assets-utils"

import { Balance } from "../../interfaces"
import { TableRowComponentProps } from "../../utils/table-utils"

export function NetworthTableRow(props: TableRowComponentProps<Balance>) {
  const {
    row,
    isTablet,
    headCells: _headCells,
    isMobile: _isMobile,
    relativeTime: _relativeTime,
    ...rest
  } = props
  const { assetId, balance, price, value } = row

  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell sx={{ width: "100%" }} variant="clickable">
          <AppLink to={`./asset/${encodeURI(assetId)}`}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <MyAssetBlock
                id={assetId}
                size="medium"
                secondary={<AmountBlock amount={balance} />}
              />
              <Stack alignItems="flex-end">
                <Typography variant="body1">
                  <QuoteAmountBlock amount={value} />
                </Typography>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  fontWeight={300}
                  letterSpacing={0.5}
                >
                  <QuoteAmountBlock amount={price?.value} formatting="price" />
                </Typography>
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
        <AppLink to={`./asset/${encodeURI(assetId)}`}>
          <MyAssetBlock id={assetId} showPlatform />
        </AppLink>
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
