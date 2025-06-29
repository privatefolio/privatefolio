import { useStore } from "@nanostores/react"
import React from "react"
import { $quoteCurrency } from "src/stores/device-settings-store"

import { AmountBlock, AmountBlockProps } from "./AmountBlock"

export type QuoteAmountBlockProps = AmountBlockProps & {
  formatting?: "value" | "price"
}

export function QuoteAmountBlock(props: QuoteAmountBlockProps) {
  const { formatting = "value" } = props
  const currency = useStore($quoteCurrency)

  return (
    <AmountBlock
      currencySymbol={currency.symbol}
      significantDigits={formatting === "value" ? currency.maxDigits : undefined}
      maxDigits={formatting === "value" ? currency.maxDigits : undefined}
      currencyTicker={currency.id}
      {...props}
      showTicker={false}
    />
  )
}
