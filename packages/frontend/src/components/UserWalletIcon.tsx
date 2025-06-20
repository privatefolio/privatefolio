import { WalletRounded } from "@mui/icons-material"
import { SvgIconProps } from "@mui/material"
import React from "react"

export function UserWalletIcon({ sx, ...rest }: SvgIconProps) {
  return <WalletRounded fontSize="small" sx={{ verticalAlign: "text-bottom", ...sx }} {...rest} />
}
