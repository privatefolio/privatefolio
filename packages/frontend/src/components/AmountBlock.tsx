import { Box, Stack, Tooltip, Typography, TypographyProps } from "@mui/material"
import { getAutoFormatDigits } from "privatefolio-backend/build/src/utils/formatting-utils"
import React, { useMemo, useState } from "react"
import { MonoFont } from "src/theme"
import { greenColor, redColor } from "src/utils/color-utils"
import { EMPTY_OBJECT } from "src/utils/utils"

import { formatNumber } from "../utils/formatting-utils"
import { Truncate } from "./Truncate"

export type AmountBlockProps = TypographyProps & {
  amount?: string | number
  colorized?: boolean
  currencySymbol?: string
  currencyTicker?: string
  /**
   * @default false
   */
  hideTooltip?: boolean
  maxDigits?: number
  placeholder?: string
  showSign?: boolean
  showTicker?: boolean
  significantDigits?: number
  tooltipMessage?: string
}

const showSignOpts = { signDisplay: "always" } as const

export function AmountBlock(props: AmountBlockProps) {
  const {
    amount,
    currencyTicker,
    currencySymbol = "",
    significantDigits,
    tooltipMessage,
    placeholder = "Unknown",
    colorized,
    showTicker,
    showSign,
    maxDigits,
    hideTooltip = false,
    ...rest
  } = props

  const hasValue = amount !== undefined
  const amountN = hasValue ? Number(amount) : undefined
  const formatOpts = showSign && amountN !== 0 ? showSignOpts : EMPTY_OBJECT

  const { minimumFractionDigits, maximumFractionDigits } = useMemo(() => {
    if (typeof amountN !== "number") {
      return { maximumFractionDigits: maxDigits, minimumFractionDigits: significantDigits }
    }
    return getAutoFormatDigits(amountN, significantDigits)
  }, [amountN, significantDigits, maxDigits])

  const [copied, setCopied] = useState(false)

  const fullValue = useMemo(() => {
    if (typeof amountN !== "number") return ""

    return formatNumber(amountN, {
      maximumFractionDigits,
      minimumFractionDigits,
      ...formatOpts,
    })
  }, [amountN, formatOpts, minimumFractionDigits, maximumFractionDigits])

  const compactValue = useMemo(() => {
    if (typeof amountN !== "number") return ""

    return formatNumber(amountN, {
      maximumFractionDigits: minimumFractionDigits,
      minimumFractionDigits,
      notation: amountN > 1_000_000 ? "compact" : undefined,
      ...formatOpts,
    })
  }, [amountN, formatOpts, minimumFractionDigits])

  const compactLabel = useMemo(() => {
    if (typeof amountN !== "number") return ""

    let fullLabel = `${currencySymbol}${compactValue}`

    if (showTicker) {
      fullLabel = `${fullLabel} ${currencyTicker}`
    }

    fullLabel = fullLabel.replace(`${currencySymbol}-`, `-${currencySymbol}`)
    fullLabel = fullLabel.replace(`${currencySymbol}+`, `+${currencySymbol}`)

    return fullLabel
  }, [amountN, currencySymbol, currencyTicker, compactValue, showTicker])

  return (
    <Tooltip
      title={
        hideTooltip ? null : typeof amountN === "number" ? (
          <Stack alignItems="center">
            <Box sx={{ fontFamily: MonoFont }}>
              {fullValue} {currencyTicker}
            </Box>
            <span className="secondary">({copied ? "copied" : "copy to clipboard"})</span>
          </Stack>
        ) : (
          tooltipMessage
        )
      }
    >
      <Typography
        fontFamily={MonoFont}
        variant="inherit"
        component="span"
        sx={{
          color: !colorized
            ? undefined
            : typeof amountN !== "number"
              ? undefined
              : amountN === 0
                ? "text.secondary"
                : amountN > 0
                  ? greenColor
                  : redColor,
          cursor: hasValue ? "pointer" : undefined,
        }}
        onClick={() => {
          if (!hasValue) return

          const clipText = String(amount)
          navigator.clipboard.writeText(clipText)

          setCopied(true)

          setTimeout(() => {
            setCopied(false)
          }, 1_000)
        }}
        {...rest}
      >
        {typeof amountN === "number" ? (
          <Truncate>{compactLabel}</Truncate>
        ) : (
          <Typography color="text.secondary" component="span" variant="inherit">
            {placeholder}
          </Typography>
        )}
      </Typography>
    </Tooltip>
  )
}
