import { alpha, Chip } from "@mui/material"
import { grey } from "@mui/material/colors"
import { useStore } from "@nanostores/react"
import React from "react"
import { $baseCurrency } from "src/stores/account-settings-store"

import { AmountBlock } from "./AmountBlock"

type ValueChipProps = {
  value?: number
}

export function ValueChip(props: ValueChipProps) {
  const { value } = props

  const currency = useStore($baseCurrency)

  return (
    <Chip
      size="medium"
      sx={{
        "& > span": {
          padding: 0,
        },
        "& > span > span": {
          padding: 1,
        },
        background: alpha(grey[500], 0.1),
        borderRadius: 2,
        color: "text.secondary",
        fontSize: "0.9rem",
        marginX: 1,
      }}
      label={
        <AmountBlock
          amount={value}
          currencySymbol={currency.symbol}
          currencyTicker={currency.id}
          significantDigits={currency.maxDigits}
          maxDigits={currency.maxDigits}
        />
      }
    />
  )
}
