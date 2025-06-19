import { Skeleton } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { ChartData } from "src/interfaces"
import { $showQuotedAmounts } from "src/stores/account-settings-store"
import { getAssetTicker } from "src/utils/assets-utils"

import { AmountBlock, AmountBlockProps } from "./AmountBlock"
import { QuoteAmountBlock, QuoteAmountBlockProps } from "./QuoteAmountBlock"

export type AssetAmountBlockProps = AmountBlockProps &
  QuoteAmountBlockProps & {
    assetId?: string
    priceMap?: Record<string, ChartData>
    usdValue?: string
  }

export function AssetAmountBlock(props: AssetAmountBlockProps) {
  const { amount, priceMap, assetId, placeholder, usdValue, ...rest } = props

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
    <QuoteAmountBlock
      amount={usdValue || (price && amount ? price * Number(amount) : undefined)}
      placeholder={assetId && !price ? undefined : placeholder}
      {...rest}
    />
  )
}
