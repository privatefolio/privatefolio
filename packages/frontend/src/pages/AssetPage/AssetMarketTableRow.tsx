import { Box, Chip, TableCell, TableRow } from "@mui/material"
import React from "react"
import { AmountBlock } from "src/components/AmountBlock"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { TimestampBlock } from "src/components/TimestampBlock"
import { DEFAULT_CURRENCIES_MAP } from "src/stores/account-settings-store"
import { TableRowComponentProps } from "src/utils/table-utils"

export interface TickerData {
  exchangeId: string
  exchangeName: string
  exchangeType: "DEX" | "CEX"
  id: string
  pair: string
  price: number
  spread: number | undefined
  timestamp: number
  tradeUrl?: string
  trustColor: string | undefined
  trustScore: number
  volume: number
}

export function AssetMarketTableRow(props: TableRowComponentProps<TickerData>) {
  const { row, relativeTime } = props

  const currency = DEFAULT_CURRENCIES_MAP.USD

  return (
    <TableRow key={row.id}>
      <TableCell>
        <Chip label={row.exchangeType} size="small" sx={{ borderRadius: 2 }} />
      </TableCell>
      <TableCell>
        <IdentifierBlock
          label={row.exchangeName}
          id={row.exchangeId}
          href={`https://www.coingecko.com/en/exchanges/${row.exchangeId}`}
          size="small"
          linkText="View exchange on Coingecko"
        />
      </TableCell>
      <TableCell>
        {/* TODO0 update ref link */}
        <IdentifierBlock
          label={row.pair}
          id={row.pair}
          href={row.tradeUrl}
          size="small"
          linkText={`Trade pair on ${row.exchangeName}`}
        />
      </TableCell>
      <TableCell align="right" variant="clickable">
        <QuoteAmountBlock amount={row.price} formatting="price" />
      </TableCell>
      <TableCell align="right" variant="clickable">
        <AmountBlock amount={row.spread} currencyTicker={"%"} />
      </TableCell>
      <TableCell align="right" variant="clickable">
        <QuoteAmountBlock amount={row.volume} />
      </TableCell>
      <TableCell>
        <Box
          sx={{
            backgroundColor:
              row.trustColor === "green"
                ? "var(--mui-palette-success-main)"
                : row.trustColor === "yellow"
                  ? "var(--mui-palette-warning-main)"
                  : "var(--mui-palette-error-main)",
            borderRadius: "50%",
            display: "inline-block",
            height: 20,
            width: 20,
          }}
        />
      </TableCell>
      <TableCell align="right">
        {row.timestamp !== 0 ? (
          <TimestampBlock timestamp={row.timestamp} relative={relativeTime} />
        ) : (
          "N/A"
        )}
      </TableCell>
    </TableRow>
  )
}
