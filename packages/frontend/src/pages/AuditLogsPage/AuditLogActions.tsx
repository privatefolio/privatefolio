import { CalculateOutlined, DeleteForever, DownloadRounded, MoreHoriz } from "@mui/icons-material"
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
import { transformAuditLogsToCsv } from "privatefolio-backend/build/src/utils/csv-export-utils"
import React, { MutableRefObject, useState } from "react"
import { HideSpamToggle } from "src/components/HideSpamToggle"
import { QuoteCurrencyToggle } from "src/components/QuoteCurrencyToggle"
import { AuditLog } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { handleExportAuditLogsRequest } from "src/utils/backup-utils"
import { downloadCsv } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

interface AuditLogsActionsProps {
  tableDataRef?: MutableRefObject<AuditLog[]>
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
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const debugMode = useStore($debugMode)

  return (
    <Stack direction="row">
      <QuoteCurrencyToggle />
      <HideSpamToggle />
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
        {tableDataRef && (
          <MenuItem
            dense
            onClick={() => {
              const data = transformAuditLogsToCsv(tableDataRef.current)
              downloadCsv(data, `${activeAccount}-audit-logs.csv`)
              handleClose()
            }}
          >
            <ListItemAvatar>
              <DownloadRounded fontSize="small" />
            </ListItemAvatar>
            <ListItemText>Export table</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          dense
          onClick={() => {
            handleExportAuditLogsRequest(rpc, activeAccount)
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
            rpc.enqueueRecomputeBalances(activeAccount, "user")
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
                rpc.enqueueDeleteBalances(activeAccount, "user")
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
