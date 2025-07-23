import { Chip, ChipProps, Tooltip } from "@mui/material"
import React from "react"
import { PaymentPlanId } from "src/settings"

import { AppLink } from "./AppLink"

type PaymentPlanChipProps = ChipProps & {
  includeLink?: boolean
  plan: string
}

const paymentPlanColors: Partial<Record<PaymentPlanId, string>> = {
  premium: "accent",
}

export function PaymentPlanChip(props: PaymentPlanChipProps) {
  const { includeLink, plan, ...rest } = props

  const planId = plan.toLowerCase() as PaymentPlanId
  const color = paymentPlanColors[planId] || "secondary"

  return (
    <>
      <Tooltip title={includeLink ? `Feature available only to ${plan} subscribers` : null}>
        <Chip
          size="small"
          sx={{
            "& .MuiChip-label": {
              paddingX: 0.75,
            },
            "&:hover": {
              border: `1px solid var(--mui-palette-${color}-main)`,
            },
            backgroundColor: `rgba(var(--mui-palette-${color}-mainChannel) / 0.15)`,
            border: `1px solid var(--mui-palette-${color}-dark)`,
            borderRadius: 0.5,
            color: `var(--mui-palette-${color}-main)`,
            cursor: includeLink ? "pointer" : undefined,
            fontSize: "0.6875rem",
            fontWeight: 500,
            height: 16,
            letterSpacing: "0.03125rem",
            transform: planId === "premium" ? "skewX(-20deg)" : undefined,
          }}
          label={plan}
          component={includeLink ? AppLink : "div"}
          href={includeLink ? "/cloud" : undefined}
          {...rest}
        />
      </Tooltip>
    </>
  )
}
