import { Skeleton } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { ChartData } from "src/interfaces"
import { $quoteCurrency, $showQuotedAmounts } from "src/stores/account-settings-store"
import { getAssetTicker } from "src/utils/assets-utils"

import { AmountBlock, AmountBlockProps } from "./AmountBlock"

export type AssetAmountBlockProps = AmountBlockProps & {
  assetId?: string
  formatting?: "value" | "price"
  priceMap?: Record<string, ChartData>
  usdValue?: string
}

export function AssetAmountBlock(props: AssetAmountBlockProps) {
  const { amount, priceMap, assetId, placeholder, usdValue, formatting = "value", ...rest } = props

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

  if (priceMap === undefined && !usdValue) return <Skeleton sx={{ marginX: 1, minWidth: 60 }} />
  const price = assetId && priceMap ? priceMap[assetId]?.value : undefined

  return (
    <AmountBlock
      amount={usdValue || (price && amount ? price * Number(amount) : undefined)}
      currencySymbol={currency.symbol}
      currencyTicker={currency.id}
      maxDigits={formatting === "value" ? currency.maxDigits : undefined}
      significantDigits={formatting === "value" ? currency.maxDigits : undefined}
      placeholder={assetId && !price ? undefined : placeholder}
      {...rest}
      showTicker={false}
    />
  )
}
