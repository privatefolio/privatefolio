import {
  AddRounded,
  CardGiftcardRounded,
  CloudOutlined,
  CurrencyExchangeRounded,
  DataObjectRounded,
  DoneRounded,
  FolderOutlined,
  InterestsRounded,
  NorthEastRounded,
  QuestionMarkRounded,
  RemoveRounded,
  SavingsOutlined,
  ShowChartOutlined,
  SouthEastRounded,
  StopRounded,
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

type Action = AuditLogOperation | TransactionType | string

type ActionBlockProps = {
  IconComponent?: SvgIconComponent
  action: string
  color?: string
  /**
   * @default "small"
   */
  size?: "small" | "medium"
} & Omit<ChipProps, "color" | "size">

const colorMap: Partial<Record<Action, string>> = {
  Buy: greenColor,
  Fee: redColor,
  Long: greenColor,
  Open: blue[500],
  Reward: greenColor,
  Sell: redColor,
  Short: redColor,
  Swap: blue[500],
}

export const iconMap: Partial<Record<Action, SvgIconComponent>> = {
  Approve: DoneRounded,
  Buy: AddRounded,
  Closed: StopRounded,
  Connection: CloudOutlined,
  Deposit: AddRounded,
  Fee: RemoveRounded,
  "File Import": FolderOutlined,
  Gift: CardGiftcardRounded,
  Long: NorthEastRounded,
  Metadata: DataObjectRounded,
  Mint: SwapHoriz,
  Open: ShowChartOutlined,
  Other: InterestsRounded,
  "Price API": CurrencyExchangeRounded,
  Reward: AddRounded,
  Sell: RemoveRounded,
  Short: SouthEastRounded,
  Stake: SavingsOutlined,
  Swap: SwapHoriz,
  Unknown: QuestionMarkRounded,
  Unstake: SavingsOutlined,
  Unwrap: SwapHoriz,
  Withdraw: RemoveRounded,
  Wrap: SwapHoriz,
}

export function ActionBlock(props: ActionBlockProps) {
  const {
    action,
    color: colorOverride,
    IconComponent: IconComponentOverride,
    size = "small",
    ...rest
  } = props

  const color = colorOverride || colorMap[action] || grey[500]
  const IconComponent = IconComponentOverride || iconMap[action]

  return (
    <Tooltip title={action}>
      <Chip
        size={size}
        sx={{ background: alpha(color, chipBgOpacity) }}
        label={
          <Stack
            direction="row"
            gap={size === "small" ? 0.5 : 1}
            alignItems="center"
            paddingRight={0.5}
          >
            {IconComponent && <IconComponent sx={{ color, fontSize: "inherit" }} />}
            <Truncate>{action}</Truncate>
          </Stack>
        }
        {...rest}
      />
    </Tooltip>
  )
}
