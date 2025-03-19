import {
  AddRounded,
  DoneRounded,
  QuestionMarkRounded,
  RemoveRounded,
  SvgIconComponent,
  SwapHoriz,
} from "@mui/icons-material"
import { alpha, Chip, ChipProps, Stack, Tooltip } from "@mui/material"
import { blue, grey } from "@mui/material/colors"
import React from "react"
import { AuditLogOperation, TransactionType } from "src/interfaces"
import { chipBgOpacity } from "src/theme"
import { greenColor, redColor } from "src/utils/color-utils"

import { Truncate } from "./Truncate"

type Action = AuditLogOperation | TransactionType

type ActionBlockProps = {
  IconComponent?: SvgIconComponent
  action: string
  color?: string
} & Omit<ChipProps, "color">

const colorMap: Partial<Record<Action, string>> = {
  Buy: greenColor,
  Fee: redColor,
  Reward: greenColor,
  Sell: redColor,
  Swap: blue[500],
}

const iconMap: Partial<Record<Action, SvgIconComponent>> = {
  Approve: DoneRounded,
  Buy: AddRounded,
  Deposit: AddRounded,
  Fee: RemoveRounded,
  Mint: SwapHoriz,
  Reward: AddRounded,
  Sell: RemoveRounded,
  Swap: SwapHoriz,
  Unknown: QuestionMarkRounded,
  Unwrap: SwapHoriz,
  Withdraw: RemoveRounded,
  Wrap: SwapHoriz,
}

export function ActionBlock(props: ActionBlockProps) {
  const { action, color: colorOverride, IconComponent: IconComponentOverride, ...rest } = props

  const color = colorOverride || colorMap[action] || grey[500]
  const IconComponent = IconComponentOverride || iconMap[action]

  return (
    <Tooltip title={action}>
      <Chip
        size="small"
        sx={{ background: alpha(color, chipBgOpacity) }}
        label={
          <Stack direction="row" gap={0.5} alignItems="center" paddingRight={0.5}>
            {IconComponent && <IconComponent sx={{ color, fontSize: "inherit" }} />}
            <Truncate>{action}</Truncate>
          </Stack>
        }
        {...rest}
      />
    </Tooltip>
  )
}
