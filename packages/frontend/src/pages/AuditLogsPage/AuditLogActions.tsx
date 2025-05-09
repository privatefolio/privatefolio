import {
  CalculateOutlined,
  DeleteForever,
  DownloadRounded,
  MoreHoriz,
  Paid,
  PaidOutlined,
} from "@mui/icons-material"
import {
  Divider,
  IconButton,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { MutableRefObject, useState } from "react"
import { AuditLog } from "src/interfaces"
import { $showQuotedAmounts } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { exportAuditLogsToCsv } from "src/utils/csv-export-utils"
import { downloadCsv } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

interface AuditLogsActionsProps {
  tableDataRef: MutableRefObject<AuditLog[]>
}

export function AuditLogActions(props: AuditLogsActionsProps) {
  const { tableDataRef } = props
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const showQuotedAmounts = useStore($showQuotedAmounts)
  const debugMode = useStore($debugMode)

  return (
    <Stack direction="row">
      <Tooltip
        title={showQuotedAmounts ? "Show amounts in Base Asset" : "Show amounts in Quote Currency"}
      >
        <IconButton
          color="secondary"
          onClick={() => {
            $showQuotedAmounts.set(!showQuotedAmounts)
          }}
        >
          {showQuotedAmounts ? <Paid fontSize="small" /> : <PaidOutlined fontSize="small" />}
        </IconButton>
      </Tooltip>
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
            const data = exportAuditLogsToCsv(tableDataRef.current)
            downloadCsv(data, `${$activeAccount.get()}-audit-logs.csv`)
            handleClose()
          }}
        >
          <ListItemAvatar>
            <DownloadRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Export table</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={async () => {
            const accountName = $activeAccount.get()
            const auditLogs = await $rpc.get().getAuditLogs(accountName)
            const data = exportAuditLogsToCsv(auditLogs)
            downloadCsv(data, `${accountName}-audit-logs.csv`)
            handleClose()
          }}
        >
          <ListItemAvatar>
            <DownloadRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Export all audit logs</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            $rpc.get().enqueueRecomputeBalances($activeAccount.get(), "user")
            handleClose()
          }}
        >
          <ListItemAvatar>
            <CalculateOutlined fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Recompute balances</ListItemText>
        </MenuItem>
        {debugMode && (
          <div>
            <Divider textAlign="center">
              <Typography variant="caption" color="text.secondary">
                DEBUG
              </Typography>
            </Divider>
            <MenuItem
              dense
              onClick={() => {
                $rpc.get().enqueueDeleteBalances($activeAccount.get(), "user")
                handleClose()
              }}
            >
              <ListItemAvatar>
                <DeleteForever fontSize="small" />
              </ListItemAvatar>
              <ListItemText>Delete balances</ListItemText>
            </MenuItem>
          </div>
        )}
      </Menu>
    </Stack>
  )
}
