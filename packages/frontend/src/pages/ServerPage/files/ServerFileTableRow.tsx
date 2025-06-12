import { Download } from "@mui/icons-material"
import { IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
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
  const {
    row,
    relativeTime,
    headCells: _headCells,
    isMobile: _isMobile,
    isTablet: _isTablet,
    ...rest
  } = props

  const { description, id, name, scheduledAt, status, createdBy } = row

  const activeAccount = useStore($activeAccount)

  return (
    <>
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
          <Stack direction="row" alignItems="center" justifyContent="flex-end">
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
          </Stack>
        </TableCell>
      </TableRow>
    </>
  )
}
