import { Chip } from "@mui/material"
import React from "react"

import { QuoteAmountBlock } from "./QuoteAmountBlock"

type ValueChipProps = {
  value?: number
}

export function ValueChip(props: ValueChipProps) {
  const { value } = props

  return (
    <Chip
      size="small"
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
      label={<QuoteAmountBlock amount={value} disableTruncate />}
    />
  )
}
