import { Download } from "@mui/icons-material"
import { IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { CaptionText } from "src/components/CaptionText"
import { FileStatusIcon } from "src/components/Files/FileStatusIcon"
import { TimestampBlock } from "src/components/TimestampBlock"
import { Truncate } from "src/components/Truncate"
import { ServerFile } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { getFilterValueLabel } from "src/stores/metadata-store"
import { MonoFont } from "src/theme"
import { TableRowComponentProps } from "src/utils/table-utils"
import { downloadFile } from "src/utils/utils"
import { $rest } from "src/workers/remotes"

export function ServerFileTableRow(props: TableRowComponentProps<ServerFile>) {
  const { row, relativeTime, headCells, isMobile: _isMobile, isTablet, ...rest } = props

  const { description, id, name, scheduledAt, status, createdBy } = row

  const activeAccount = useStore($activeAccount)

  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell colSpan={headCells.length} variant="clickable">
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Stack gap={0.5} marginY={0.5} flexGrow={1} minWidth={0}>
              <Typography variant="body1" fontFamily={MonoFont} component="div">
                <Truncate>{name}</Truncate>
              </Typography>
              {!!description && (
                <CaptionText>
                  <Truncate>{description}</Truncate>
                </CaptionText>
              )}
              <CaptionText>
                <TimestampBlock timestamp={scheduledAt} relative={relativeTime} /> •{" "}
                {getFilterValueLabel(createdBy)}
              </CaptionText>
            </Stack>
            <Stack alignItems="flex-end" gap={0.5} sx={{ minWidth: 120 }}>
              <Stack direction="row" alignItems="center" gap={1}>
                <FileStatusIcon file={row} />
                <Typography component="span" variant="inherit" sx={{ textTransform: "capitalize" }}>
                  {status}
                </Typography>
              </Stack>
              {status === "completed" && (
                <Tooltip title="Download">
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={async () => {
                      const params = new URLSearchParams({
                        accountName: activeAccount,
                        fileId: row.id.toString(),
                      })

                      const { baseUrl, jwtKey } = $rest.get()

                      const response = await fetch(`${baseUrl}/download?${params.toString()}`, {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(jwtKey)}`,
                        },
                      })

                      const blob = await response.blob()

                      downloadFile(blob, row.name)
                    }}
                  >
                    <Download fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow hover {...rest}>
      <TableCell>
        <Typography variant="inherit" fontFamily={MonoFont}>
          {id}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="inherit">
          <TimestampBlock timestamp={scheduledAt} relative={relativeTime} />
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="inherit" component="div">
          <Truncate>{name}</Truncate>
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="inherit" component="div">
          <Truncate>{description}</Truncate>
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="inherit" component="div">
          <Truncate>{getFilterValueLabel(createdBy)}</Truncate>
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="inherit" component="div">
          <Truncate>5s</Truncate>
        </Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" alignItems="center" gap={1}>
          <FileStatusIcon file={row} />
          <Typography component="span" variant="inherit" sx={{ textTransform: "capitalize" }}>
            {status}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell variant="actionList">
        {/* {(status === "queued" || status === "running") && (
              <Tooltip title={status === "queued" ? "Cancel" : "Abort"}>
                <IconButton
                  aria-label="Cancel Task"
                  size="small"
                  color="secondary"
                  onClick={() => rpc.cancelTask(activeAccount, id)}
                >
                  <CancelOutlined fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )} */}
        {status === "completed" && (
          <Tooltip title="Download">
            <IconButton
              size="small"
              color="secondary"
              onClick={async () => {
                const params = new URLSearchParams({
                  accountName: activeAccount,
                  fileId: row.id.toString(),
                })

                const { baseUrl, jwtKey } = $rest.get()

                const response = await fetch(`${baseUrl}/download?${params.toString()}`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem(jwtKey)}`,
                  },
                })

                const blob = await response.blob()

                downloadFile(blob, row.name)
              }}
            >
              <Download fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  )
}
