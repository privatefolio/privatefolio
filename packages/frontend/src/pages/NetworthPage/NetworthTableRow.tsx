import { Stack, TableCell, TableRow, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { AmountBlock } from "src/components/AmountBlock"
import { AppLink } from "src/components/AppLink"
import { MyAssetBlock } from "src/components/MyAssetBlock"
import { $quoteCurrency } from "src/stores/account-settings-store"
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

  const currency = useStore($quoteCurrency)

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
                  <AmountBlock
                    amount={value}
                    currencySymbol={currency.symbol}
                    currencyTicker={currency.id}
                    significantDigits={currency.significantDigits}
                    maxDigits={currency.maxDigits}
                  />
                </Typography>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  fontWeight={300}
                  letterSpacing={0.5}
                >
                  <AmountBlock
                    amount={price?.value}
                    currencySymbol={currency.symbol}
                    currencyTicker={currency.id}
                    significantDigits={currency.maxDigits}
                    maxDigits={currency.maxDigits}
                  />
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
        <AmountBlock
          amount={price?.value}
          currencySymbol={currency.symbol}
          currencyTicker={currency.id}
          significantDigits={currency.maxDigits}
          maxDigits={currency.maxDigits}
        />
      </TableCell>
      <TableCell variant="clickable" align="right">
        <AmountBlock
          amount={value}
          currencySymbol={currency.symbol}
          currencyTicker={currency.id}
          significantDigits={currency.maxDigits}
          maxDigits={currency.maxDigits}
        />
      </TableCell>
    </TableRow>
  )
}
