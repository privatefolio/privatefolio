import { Skeleton } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { ChartData } from "src/interfaces"
import { $quoteCurrency, $showQuotedAmounts } from "src/stores/account-settings-store"
import { getAssetTicker } from "src/utils/assets-utils"

import { AmountBlock, AmountBlockProps } from "./AmountBlock"

type AssetAmountBlockProps = AmountBlockProps & {
  assetId?: string
  priceMap?: Record<string, ChartData>
}

export function AssetAmountBlock(props: AssetAmountBlockProps) {
  const { amount, priceMap, assetId, placeholder, ...rest } = props

  const currency = useStore($quoteCurrency)
  const showQuotedAmounts = useStore($showQuotedAmounts)

  if (!showQuotedAmounts) {
    return (
      <AmountBlock
        amount={amount}
        currencyTicker={getAssetTicker(assetId)}
        placeholder={placeholder}
        {...rest}
        //
      />
    )
  }

  if (priceMap === undefined) return <Skeleton sx={{ minWidth: 60 }} />
  const price = assetId ? priceMap[assetId]?.value : undefined

  return (
    <AmountBlock
      amount={price && amount ? price * Number(amount) : undefined}
      currencySymbol={currency.symbol}
      currencyTicker={currency.id}
      significantDigits={currency.maxDigits}
      maxDigits={currency.maxDigits}
      placeholder={assetId && !price ? undefined : placeholder}
      {...rest}
    />
  )
}
