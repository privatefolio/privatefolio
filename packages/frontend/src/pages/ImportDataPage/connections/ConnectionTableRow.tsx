import { Visibility } from "@mui/icons-material"
import {
  Box,
  IconButton,
  Skeleton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material"
import React from "react"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { TimestampBlock } from "src/components/TimestampBlock"
import { Truncate } from "src/components/Truncate"
import { useBoolean } from "src/hooks/useBoolean"
import { Connection } from "src/interfaces"
import { getAddressBookEntry } from "src/stores/metadata-store"
import { MonoFont } from "src/theme"
import { formatNumber } from "src/utils/formatting-utils"
import { TableRowComponentProps } from "src/utils/table-utils"

import { ConnectionDrawer } from "./ConnectionDrawer"

export function ConnectionTableRow(props: TableRowComponentProps<Connection>) {
  const { row, relativeTime, headCells, isMobile: _isMobile, isTablet, ...rest } = props
  const { apiKey: key, address, timestamp, syncedAt, platformId, meta, connectionNumber } = row
  const { value: open, toggle: toggleOpen } = useBoolean(false)

  const wallet = (address ?? key) as string

  if (isTablet) {
    return (
      <>
        <TableRow hover {...rest}>
          <TableCell colSpan={headCells.length} onClick={toggleOpen} variant="clickable">
            <Stack gap={1} direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack gap={0.5} marginY={0.5}>
                <Stack direction="row" gap={1} alignItems="center" component="div">
                  {platformId ? (
                    <PlatformBlock id={platformId} hideName />
                  ) : (
                    <Skeleton height={20} width={80} />
                  )}
                  <Tooltip title={address}>
                    <Truncate sx={{ fontFamily: MonoFont, maxWidth: 160 }}>{address}</Truncate>
                  </Tooltip>
                </Stack>
                <Box sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                  {timestamp ? (
                    <TimestampBlock timestamp={timestamp} relative={relativeTime} hideTime />
                  ) : (
                    <Skeleton height={20} width={80} sx={{ display: "inline-block" }} />
                  )}
                  {" • "}
                  {!syncedAt ? (
                    <Typography color="text.secondary" component="span" variant="inherit">
                      Not synced
                    </Typography>
                  ) : (
                    <span>
                      <span>Synced</span>{" "}
                      <TimestampBlock timestamp={syncedAt} relative={relativeTime} hideTime />
                    </span>
                  )}
                </Box>
              </Stack>
              <Stack gap={0.5} alignItems={"flex-end"} sx={{ fontSize: "0.75rem", minWidth: 90 }}>
                <span>{formatNumber(meta?.logs || 0)} audit logs</span>
                <span>{formatNumber(meta?.transactions || 0)} txns</span>
              </Stack>
            </Stack>
          </TableCell>
        </TableRow>
        <ConnectionDrawer
          key={row.id}
          open={open}
          toggleOpen={toggleOpen}
          connection={row}
          relativeTime={relativeTime}
        />
      </>
    )
  }

  return (
    <>
      <TableRow hover {...rest}>
        <TableCell>{connectionNumber}</TableCell>
        <TableCell>
          {!syncedAt ? (
            <Typography color="text.secondary" component="span" variant="inherit">
              Not synced
            </Typography>
          ) : (
            <TimestampBlock timestamp={syncedAt} relative={relativeTime} />
          )}
        </TableCell>
        <TableCell>
          <PlatformBlock id={platformId} hideName />
        </TableCell>
        <TableCell>
          <IdentifierBlock id={wallet} variant="tablecell" label={getAddressBookEntry(wallet)} />
        </TableCell>
        <TableCell sx={{ fontFamily: MonoFont }} align="right">
          {meta?.logs === meta?.rows ? (
            <span>{formatNumber(meta?.logs || 0)}</span>
          ) : (
            <Tooltip
              title={`${formatNumber(meta?.logs || 0)} audit logs extracted from ${formatNumber(
                meta?.rows || 0
              )} entries`}
            >
              <span>{formatNumber(meta?.logs || 0)}</span>
            </Tooltip>
          )}
        </TableCell>
        <TableCell sx={{ fontFamily: MonoFont }} align="right">
          <Tooltip
            title={`${formatNumber(
              meta?.transactions || 0
            )} transactions extracted from ${formatNumber(meta?.rows || 0)} entries`}
          >
            <span>{formatNumber(meta?.transactions || 0)}</span>
          </Tooltip>
        </TableCell>
        <TableCell variant="actionList">
          <Tooltip title="Inspect">
            <IconButton size="small" color="secondary" onClick={toggleOpen}>
              <Visibility fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <ConnectionDrawer
        key={row.id}
        open={open}
        toggleOpen={toggleOpen}
        connection={row}
        relativeTime={relativeTime}
      />
    </>
  )
}
