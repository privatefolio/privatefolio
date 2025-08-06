import { Chip, Drawer, DrawerProps, Stack, Typography } from "@mui/material"
import React from "react"
import { DrawerHeader } from "src/components/DrawerHeader"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TimestampBlock } from "src/components/TimestampBlock"
import { ServerLog } from "src/interfaces"
import { PopoverToggleProps } from "src/stores/app-store"

const getLogLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "error":
      return "var(--mui-palette-error-main)"
    case "warn":
      return "var(--mui-palette-warning-main)"
    case "fatal":
      return "var(--mui-palette-error-dark)"
    case "debug":
      return "var(--mui-palette-text-secondary)"
    case "trace":
      return "var(--mui-palette-text-disabled)"
    // case "info":
    default:
      return "var(--mui-palette-text-primary)"
  }
}

type ServerLogDrawerProps = DrawerProps &
  PopoverToggleProps & {
    relativeTime: boolean
    serverLog: ServerLog
  }

export function ServerLogDrawer(props: ServerLogDrawerProps) {
  const { open, toggleOpen, serverLog, relativeTime, ...rest } = props

  const { id, level, message, properties, timestamp, categories } = serverLog

  const { stackTrace, ...otherProps } = properties

  return (
    <Drawer open={open} onClose={toggleOpen} {...rest}>
      <Stack
        paddingX={2}
        paddingY={1}
        gap={2}
        sx={(theme) => ({
          maxWidth: 450,
          minWidth: 450,
          overflowX: "hidden",
          ...theme.typography.body2,
        })}
      >
        <DrawerHeader toggleOpen={toggleOpen}>Server log details</DrawerHeader>

        <div>
          <SectionTitle>Log Id</SectionTitle>
          <IdentifierBlock id={id} />
        </div>

        <div>
          <SectionTitle>Created</SectionTitle>
          <TimestampBlock timestamp={timestamp} relative={relativeTime} />
        </div>

        <div>
          <SectionTitle>Level</SectionTitle>
          <Typography
            variant="inherit"
            sx={{ color: getLogLevelColor(level), textTransform: "capitalize" }}
          >
            {level}
          </Typography>
        </div>

        <div>
          <SectionTitle>Message</SectionTitle>
          <Typography
            variant="body2"
            sx={{
              color: getLogLevelColor(level),
            }}
          >
            {message}
          </Typography>
        </div>

        {!!stackTrace && (
          <div>
            <SectionTitle>Stack trace</SectionTitle>
            <Typography
              variant="body2"
              component="pre"
              sx={{
                background: "var(--mui-palette-background-default)",
                borderRadius: 0.5,
                color: getLogLevelColor(level),
                overflow: "auto",
                padding: 1,
              }}
            >
              {stackTrace as string}
            </Typography>
          </div>
        )}

        {Object.keys(otherProps).length > 0 && (
          <div>
            <SectionTitle>Metadata</SectionTitle>
            <Typography
              variant="body2"
              component="pre"
              sx={{
                background: "var(--mui-palette-background-default)",
                borderRadius: 0.5,
                overflow: "auto",
                padding: 1,
              }}
            >
              {JSON.stringify(otherProps, null, 2)}
            </Typography>
          </div>
        )}

        <div>
          <SectionTitle>Categories</SectionTitle>
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {categories.map((x) => (
              <Chip key={x} label={x} size="small" sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        </div>
      </Stack>
    </Drawer>
  )
}
