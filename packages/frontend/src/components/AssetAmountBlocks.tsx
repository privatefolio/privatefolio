import { UnfoldLess, UnfoldMore } from "@mui/icons-material"
import { Chip, Stack } from "@mui/material"
import Big from "big.js"
import React, { useMemo, useState } from "react"

import { AmountBlock } from "./AmountBlock"
import { AssetAmountBlock, AssetAmountBlockProps } from "./AssetAmountBlock"

export type AssetAmountBlockValue = [string, string, string] | [string, string, string, string]

type AssetAmountBlocksProps = {
  aggregation?: "sum" | "average"
  values: AssetAmountBlockValue[]
} & AssetAmountBlockProps

export function AssetAmountBlocks(props: AssetAmountBlocksProps) {
  const { values, aggregation = "sum", ...rest } = props
  const [isExpanded, setIsExpanded] = useState(false)

  const aggregatedValues = useMemo(() => {
    if (!values || values.length === 0) return []

    if (aggregation === "average") {
      const grouped = values.reduce(
        (acc, [assetId, amount, usdValue]) => {
          if (!acc[assetId]) {
            acc[assetId] = {
              count: 0,
              totalAmount: Big(0),
              totalUsdValue: Big(0),
            }
          }
          acc[assetId].totalAmount = acc[assetId].totalAmount.plus(Big(amount))
          acc[assetId].totalUsdValue = acc[assetId].totalUsdValue.plus(Big(usdValue))
          acc[assetId].count++
          return acc
        },
        {} as Record<string, { count: number; totalAmount: Big; totalUsdValue: Big }>
      )

      return Object.entries(grouped).map(
        ([assetId, { totalAmount, totalUsdValue, count }]) =>
          [assetId, totalAmount.div(count).toString(), totalUsdValue.div(count).toString()] as [
            string,
            string,
            string,
          ]
      )
    }

    const aggregated = values.reduce(
      (acc, [assetId, amount, usdValue]) => {
        if (!acc[assetId]) {
          acc[assetId] = {
            amount: 0,
            usdValue: 0,
          }
        }
        acc[assetId].amount += Number(amount)
        acc[assetId].usdValue += Number(usdValue)
        return acc
      },
      {} as Record<string, { amount: number; usdValue: number }>
    )

    return Object.entries(aggregated).map(
      ([assetId, { amount, usdValue }]) =>
        [assetId, amount.toString(), usdValue.toString()] as [string, string, string]
    )
  }, [values, aggregation])

  const displayValues = isExpanded ? values : aggregatedValues

  return (
    <Stack direction="row" gap={0.5} flexWrap="wrap" alignItems="center">
      {values && values.length > 0 ? (
        <>
          {displayValues.map(([assetId, amount, usdValue], index) => (
            <Chip
              size="small"
              key={`${assetId}-${index}`}
              label={
                <AssetAmountBlock
                  key={assetId}
                  amount={amount}
                  usdValue={usdValue}
                  assetId={assetId}
                  showTicker
                  {...rest}
                />
              }
            />
          ))}
          {values.length > 1 && (
            <Chip
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{
                "& .MuiChip-label": {
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "center",
                  transform: "rotate(90deg)",
                },
                minWidth: "auto",
              }}
              label={
                !isExpanded ? <UnfoldMore fontSize="inherit" /> : <UnfoldLess fontSize="inherit" />
              }
            />
          )}
        </>
      ) : (
        <AmountBlock placeholder="None" />
      )}
    </Stack>
  )
}
