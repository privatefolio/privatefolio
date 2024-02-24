import { Visibility } from "@mui/icons-material"
import { IconButton, Skeleton, Stack, TableCell, TableRow, Tooltip } from "@mui/material"
import React from "react"
import { PlatformBlock } from "src/components/PlatformBlock"
import { TimestampBlock } from "src/components/TimestampBlock"
import { Truncate } from "src/components/Truncate"
import { useBoolean } from "src/hooks/useBoolean"
import { FileImport } from "src/interfaces"
import { MonoFont } from "src/theme"
import { formatFileSize, formatNumber } from "src/utils/formatting-utils"
import { TableRowComponentProps } from "src/utils/table-utils"

import { FileImportDrawer } from "./FileImportDrawer"

export function FileImportTableRow(props: TableRowComponentProps<FileImport>) {
  const { row, relativeTime, headCells: _headCells, isMobile: _isMobile, isTablet, ...rest } = props
  const { name, meta, timestamp, lastModified, size } = row
  const platform = meta?.platform

  const { value: open, toggle: toggleOpen } = useBoolean(false)

  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell sx={{ width: "100%" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack gap={0.5}>
              <Stack direction="row" gap={1} alignItems="center" component="div">
                {platform ? (
                  <PlatformBlock platform={platform} hideName />
                ) : (
                  <Skeleton height={20} width={80} />
                )}
                <Tooltip title={name}>
                  <Truncate sx={{ maxWidth: 200 }}>{name}</Truncate>
                </Tooltip>
              </Stack>
              <Stack
                direction="row"
                gap={1}
                alignItems="center"
                component="div"
                sx={{ color: "text.secondary", fontSize: "0.75rem" }}
              >
                {timestamp ? (
                  <TimestampBlock timestamp={timestamp} relative={relativeTime} />
                ) : (
                  <Skeleton height={20} width={80} />
                )}
                {" • "}
                <Tooltip
                  title={
                    <Stack>
                      <span>{formatFileSize(size, true)}</span>
                      <i className="secondary">
                        <span>{formatNumber(size)} Bytes</span>
                      </i>
                    </Stack>
                  }
                >
                  <span>{formatFileSize(size)}</span>
                </Tooltip>
              </Stack>
            </Stack>
            <Stack gap={0.5} alignItems={"flex-end"} sx={{ fontSize: "0.75rem" }}>
              {!meta ? (
                <Skeleton height={20} width={80} />
              ) : (
                <>
                  {meta.logs === meta.rows ? (
                    <span>{formatNumber(meta.logs)} audit logs</span>
                  ) : (
                    <Tooltip
                      title={`${formatNumber(meta.logs)} audit logs extracted from ${formatNumber(
                        meta.rows
                      )} document entries`}
                    >
                      <span>{formatNumber(meta.logs)}</span>
                    </Tooltip>
                  )}
                </>
              )}
              {!meta ? (
                <Skeleton height={20} width={80} />
              ) : (
                <>
                  <Tooltip
                    title={`${formatNumber(
                      meta.transactions
                    )} transactions extracted from ${formatNumber(meta.rows)} document entries`}
                  >
                    <span>{formatNumber(meta.transactions)} txns</span>
                  </Tooltip>
                </>
              )}
            </Stack>
          </Stack>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      <TableRow hover {...rest}>
        <TableCell>
          {timestamp ? (
            <TimestampBlock timestamp={timestamp} relative={relativeTime} />
          ) : (
            <Skeleton></Skeleton>
          )}
        </TableCell>
        <TableCell>
          {platform ? <PlatformBlock platform={platform} hideName /> : <Skeleton></Skeleton>}
        </TableCell>
        <TableCell>
          <Tooltip title={name}>
            <Truncate>{name}</Truncate>
          </Tooltip>
        </TableCell>
        <TableCell sx={{ fontFamily: MonoFont }} align="right">
          <Tooltip
            title={
              <Stack>
                <span>{formatFileSize(size, true)}</span>
                <i className="secondary">
                  <span>{formatNumber(size)} Bytes</span>
                </i>
              </Stack>
            }
          >
            <span>{formatFileSize(size)}</span>
          </Tooltip>
        </TableCell>
        <TableCell>
          <TimestampBlock timestamp={lastModified} relative={relativeTime} />
        </TableCell>
        <TableCell sx={{ fontFamily: MonoFont }} align="right">
          {!meta ? (
            <Skeleton></Skeleton>
          ) : (
            <>
              {meta.logs === meta.rows ? (
                <span>{formatNumber(meta.logs)}</span>
              ) : (
                <Tooltip
                  title={`${formatNumber(meta.logs)} audit logs extracted from ${formatNumber(
                    meta.rows
                  )} document entries`}
                >
                  <span>{formatNumber(meta.logs)}</span>
                </Tooltip>
              )}
            </>
          )}
        </TableCell>
        <TableCell sx={{ fontFamily: MonoFont }} align="right">
          {!meta ? (
            <Skeleton></Skeleton>
          ) : (
            <>
              <Tooltip
                title={`${formatNumber(
                  meta.transactions
                )} transactions extracted from ${formatNumber(meta.rows)} document entries`}
              >
                <span>{formatNumber(meta.transactions)}</span>
              </Tooltip>
            </>
          )}
        </TableCell>
        <TableCell>
          <Tooltip title="Inspect">
            <IconButton
              size="small"
              color="secondary"
              sx={{
                ".MuiTableRow-root:hover &": {
                  visibility: "visible",
                },
                height: 28,
                marginLeft: -1,
                marginY: -0.25,
                visibility: "hidden",
              }}
              onClick={toggleOpen}
            >
              <Visibility fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <FileImportDrawer
        key={row._id}
        open={open}
        toggleOpen={toggleOpen}
        fileImport={row}
        relativeTime={relativeTime}
      />
    </>
  )
}
