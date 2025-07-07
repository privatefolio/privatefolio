import { HandymanOutlined } from "@mui/icons-material"
import { Box, Stack, Tooltip, Typography } from "@mui/material"
import { ToolInvocation } from "ai"
import React from "react"
import { CircularSpinner } from "src/components/CircularSpinner"

type ToolComponentProps = {
  args?: ToolInvocation["args"]
  children: React.ReactNode
  state?: ToolInvocation["state"]
}

export function ToolComponent(props: ToolComponentProps) {
  const { args, children, state } = props

  const label = (
    <Tooltip
      title={
        !args ? null : (
          <Stack alignItems="center">
            <span className="secondary">Call arguments</span>
            <span>{JSON.stringify(args, null, 2)}</span>
          </Stack>
        )
      }
    >
      <Box
        sx={{
          backgroundColor: "action.hover",
          borderRadius: 2,
          letterSpacing: "0.05rem",
          paddingX: 0.75,
        }}
        component="span"
      >
        {children}
      </Box>
    </Tooltip>
  )

  return (
    <Stack alignItems="flex-start" sx={{ display: "inline-flex" }}>
      <Typography
        variant="body2"
        color="text.secondary"
        component={Stack}
        direction="row"
        alignItems="center"
        gap={1}
        sx={{
          backgroundColor: "var(--mui-palette-background-paper)",
          borderRadius: 3,
          marginBottom: 0.5,
          marginRight: 0.5,
          paddingX: 1,
          paddingY: 0.5,
        }}
      >
        {state === "call" && <CircularSpinner size={14} />}
        {state === "result" && <HandymanOutlined fontSize="inherit" />}
        {state === "partial-call" && <CircularSpinner size={14} />}
        {state === "call" && <>Using {label}...</>}
        {state === "result" && <>Used {label}</>}
        {state === "partial-call" && `Calling ${label}...`}
        {state === undefined && (
          <>
            <HandymanOutlined fontSize="inherit" /> {children}
          </>
        )}
      </Typography>
    </Stack>
  )
}
