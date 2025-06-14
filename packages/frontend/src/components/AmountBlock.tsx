import { Box, Stack, Tooltip, Typography, TypographyProps } from "@mui/material"
import { useStore } from "@nanostores/react"
import { getDecimalPrecision } from "privatefolio-backend/build/src/utils/formatting-utils"
import React, { useMemo, useState } from "react"
import { $debugMode } from "src/stores/app-store"
import { MonoFont } from "src/theme"
import { greenColor, redColor } from "src/utils/color-utils"
import { EMPTY_OBJECT } from "src/utils/utils"

import { formatNumber } from "../utils/formatting-utils"

export type AmountBlockProps = TypographyProps & {
  amount?: string | number
  colorized?: boolean
  currencySymbol?: string
  currencyTicker?: string
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
    ...rest
  } = props

  const hasValue = amount !== undefined
  const amountN = hasValue ? Number(amount) : undefined
  const formatOpts = showSign && amountN !== 0 ? showSignOpts : EMPTY_OBJECT

  const debugMode = useStore($debugMode)

  let minimumFractionDigits = debugMode ? 4 : significantDigits
  let maximumFractionDigits: number | undefined

  // auto-adjust minimumFractionDigits
  if (minimumFractionDigits === undefined && typeof amountN === "number") {
    if (amountN > 10_000 || amountN < -10_000) {
      minimumFractionDigits = 0
    } else if (amountN < 1 && amountN > -1) {
      minimumFractionDigits = Math.min(getDecimalPrecision(amountN), 6)
    }

    maximumFractionDigits = getDecimalPrecision(amountN)
  }

  // auto-adjust maximumFractionDigits
  if (
    minimumFractionDigits !== undefined &&
    maximumFractionDigits === undefined &&
    typeof amountN === "number"
  ) {
    if (amountN > 10_000 || amountN < -10_000) {
      maximumFractionDigits = Math.max(0, minimumFractionDigits)
    } else if (amountN < 1 && amountN > -1) {
      maximumFractionDigits = Math.max(minimumFractionDigits, getDecimalPrecision(amountN))
    } else {
      maximumFractionDigits = minimumFractionDigits
    }
  }

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

  const fullLabel = useMemo(() => {
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
        typeof amountN === "number" ? (
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

          const clipText = maxDigits ? (amountN as number).toFixed(maxDigits) : String(amount)
          navigator.clipboard.writeText(clipText)

          setCopied(true)

          setTimeout(() => {
            setCopied(false)
          }, 1_000)
        }}
        {...rest}
      >
        {typeof amountN === "number" ? (
          fullLabel
        ) : (
          <Typography color="text.secondary" component="span" variant="inherit">
            {placeholder}
          </Typography>
        )}
      </Typography>
    </Tooltip>
  )
}
