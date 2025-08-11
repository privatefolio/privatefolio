import { DataObject, Visibility } from "@mui/icons-material"
import { IconButton, TableCell, TableRow, Tooltip, Typography } from "@mui/material"
import React, { memo } from "react"
import { TimestampBlock } from "src/components/TimestampBlock"
import { useBoolean } from "src/hooks/useBoolean"
import { ServerLog } from "src/interfaces"
import { TableRowComponentProps } from "src/utils/table-utils"

import { ServerLogDrawer } from "./ServerLogDrawer"

const getLogLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "error":
      return "var(--mui-palette-error-main)"
    case "warn":
      return "var(--mui-palette-warning-main)"
    // case "info":
    // return "var(--mui-palette-text-secondary)"
  }
}

const getLogLevelBgColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "error":
      return "rgba(var(--mui-palette-error-darkChannel) / 0.1)"
    case "warn":
      return "rgba(var(--mui-palette-warning-darkChannel) / 0.1)"
    // case "info":
    //   return undefined
  }
}

function ServerLogTableRowBase(props: TableRowComponentProps<ServerLog>) {
  const {
    row,
    relativeTime,
    headCells: _headCells,
    isMobile: _isMobile,
    isTablet: _isTablet,
    ...rest
  } = props

  const { value: open, toggle: toggleOpen } = useBoolean(false)
  const hasProperties = Object.keys(row.properties).length > 0

  return (
    <>
      <TableRow
        hover
        {...rest}
        sx={{
          backgroundColor: getLogLevelBgColor(row.level),
        }}
      >
        <TableCell>
          <TimestampBlock timestamp={row.timestamp} relative={relativeTime} />
        </TableCell>
        <TableCell>
          <Typography
            variant="inherit"
            sx={{ color: getLogLevelColor(row.level), textTransform: "capitalize" }}
          >
            {row.level}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="inherit" sx={{ color: getLogLevelColor(row.level) }}>
            {row.message}
          </Typography>
        </TableCell>
        <TableCell variant="actionList" sx={{ position: "relative" }} align="right">
          {hasProperties && (
            <IconButton
              size="small"
              color="secondary"
              sx={{
                ".MuiTableRow-root:hover & ": {
                  visibility: "hidden !important",
                },
                position: "absolute",
                right: 16,
                top: 8,
                visibility: "visible !important",
              }}
            >
              <DataObject fontSize="inherit" />
            </IconButton>
          )}
          <Tooltip title="Inspect">
            <IconButton size="small" color="secondary" onClick={toggleOpen}>
              <Visibility fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <ServerLogDrawer
        key={row.id}
        open={open}
        toggleOpen={toggleOpen}
        serverLog={row}
        relativeTime={relativeTime}
      />
    </>
  )
}

export const ServerLogTableRow = memo(ServerLogTableRowBase)
