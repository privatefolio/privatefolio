import { Box, Stack, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useState } from "react"

import { Timestamp } from "../interfaces"
import { $debugMode } from "../stores/app-store"
import {
  formatDate,
  formatDateRelative,
  formatDateWithHour,
  formatHour,
} from "../utils/formatting-utils"

type TimestampBlockProps = {
  hideTime?: boolean
  relative?: boolean
  timestamp: Timestamp
  variant?: "default" | "simple"
}

export function TimestampBlock(props: TimestampBlockProps) {
  const { timestamp, hideTime = false, relative, variant = "default" } = props

  const debugMode = useStore($debugMode)
  const [copied, setCopied] = useState(false)

  if (variant === "simple") {
    return (
      <>
        <span>{formatDate(timestamp)}</span>
        <Typography variant="inherit" color="text.secondary" component="span">
          {" "}
          ({formatDateRelative(timestamp)})
        </Typography>
      </>
    )
  }

  return (
    <Tooltip
      title={
        <Stack alignItems="center">
          <span>
            {formatDateWithHour(timestamp, {
              // fractionalSecondDigits: debugMode ? 3 : undefined,
              second: debugMode ? "numeric" : undefined,
              timeZoneName: "short",
            })}{" "}
          </span>
          <span className="secondary">
            {formatDateWithHour(timestamp, {
              // fractionalSecondDigits: debugMode ? 3 : undefined,
              second: debugMode ? "numeric" : undefined,
              timeZone: "UTC",
              timeZoneName: "short",
            })}
          </span>
          {debugMode && (
            <>
              <span>
                {timestamp} <span className="secondary">unix timestamp</span>
              </span>
              <span className="secondary">({copied ? "copied" : "copy to clipboard"})</span>
            </>
          )}
        </Stack>
      }
    >
      <Box
        component="span"
        sx={{
          cursor: debugMode ? "pointer" : undefined,
        }}
        onClick={() => {
          if (!debugMode) return

          const clipText = String(timestamp)
          navigator.clipboard.writeText(clipText)

          setCopied(true)

          setTimeout(() => {
            setCopied(false)
          }, 1_000)
        }}
      >
        {relative ? (
          <span>{formatDateRelative(timestamp)}</span>
        ) : (
          <>
            <span>{formatDate(timestamp)}</span>{" "}
            {!hideTime && (
              <Typography component="span" color="text.secondary" variant="inherit">
                at {formatHour(timestamp)}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Tooltip>
  )
}
