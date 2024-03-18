import { CallMergeRounded, DownloadRounded, MemoryRounded, MoreHoriz } from "@mui/icons-material"
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material"
import React, { useState } from "react"
import { exportAuditLogsToCsv } from "src/api/account/file-imports/csv-export-utils"
import { AuditLog } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { enqueueTask, TaskPriority } from "src/stores/task-store"
import { enqueueAutoMerge, enqueueExportAllAuditLogs } from "src/utils/common-tasks"
import { downloadCsv } from "src/utils/utils"
import { clancy } from "src/workers/remotes"

interface AuditLogsActionsProps {
  tableData: AuditLog[]
}

export function AuditLogActions(props: AuditLogsActionsProps) {
  const { tableData } = props
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Tooltip title="Actions">
        <IconButton color="secondary" onClick={handleClick}>
          <MoreHoriz fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        <MenuItem
          dense
          onClick={() => {
            const data = exportAuditLogsToCsv(tableData)
            downloadCsv(data, "audit-logs.csv")
            handleClose()
          }}
        >
          <ListItemIcon>
            <DownloadRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export table</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            enqueueExportAllAuditLogs()
            handleClose()
          }}
        >
          <ListItemIcon>
            <DownloadRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export all audit logs</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            enqueueAutoMerge()
            handleClose()
          }}
        >
          <ListItemIcon>
            <CallMergeRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Auto-merge audit logs</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            enqueueTask({
              description: "Recomputing indexes for all audit logs.",
              function: async (progress) => {
                await clancy.indexAuditLogs(progress, $activeAccount.get())
              },
              name: "Recompute audit logs indexes",
              priority: TaskPriority.Low,
            })
            handleClose()
          }}
        >
          <ListItemIcon>
            <MemoryRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Recompute indexes</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
