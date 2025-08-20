import { StopCircle } from "@mui/icons-material"
import React from "react"
import { PulsatingDot } from "src/components/PulsatingDot"
import { TradeStatus } from "src/interfaces"

export function TradeStatusIcon({ status }: { status?: TradeStatus }) {
  if (status === "open") {
    return <PulsatingDot />
  }

  if (status === "closed") {
    return <StopCircle sx={{ height: 20, width: 20 }} color="primary" />
  }

  return null
}
