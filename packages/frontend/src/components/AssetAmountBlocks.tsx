import { UnfoldLess, UnfoldMore } from "@mui/icons-material"
import { Chip, Stack } from "@mui/material"
import React, { useMemo, useState } from "react"

import { AmountBlock } from "./AmountBlock"
import { AssetAmountBlock } from "./AssetAmountBlock"

interface AssetAmountBlocksProps {
  values: [string, string, string][]
}

export function AssetAmountBlocks(props: AssetAmountBlocksProps) {
  const { values } = props
  const [isExpanded, setIsExpanded] = useState(false)

  const aggregatedValues = useMemo(() => {
    if (!values || values.length === 0) return []

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
  }, [values])

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
                  showSign
                  colorized
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
