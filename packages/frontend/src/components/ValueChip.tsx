import { Chip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { $quoteCurrency } from "src/stores/account-settings-store"

import { AmountBlock } from "./AmountBlock"

type ValueChipProps = {
  value?: number
}

export function ValueChip(props: ValueChipProps) {
  const { value } = props

  const currency = useStore($quoteCurrency)

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
        borderRadius: 2,
        color: "text.secondary",
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
