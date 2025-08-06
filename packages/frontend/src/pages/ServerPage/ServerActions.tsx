import {
  BackupRounded,
  Bedtime,
  BugReport,
  MoreHoriz,
  Refresh,
  RestoreRounded,
} from "@mui/icons-material"
import {
  Divider,
  IconButton,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { handleBackupRequest, onRestoreRequest } from "src/utils/backup-utils"
import { $rpc } from "src/workers/remotes"

export function ServerActions() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const debugMode = useStore($debugMode)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

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
            handleClose()
            handleBackupRequest(rpc, activeAccount)
          }}
        >
          <ListItemAvatar>
            <BackupRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Backup</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={() => onRestoreRequest(rpc, activeAccount, handleClose)}>
          <ListItemAvatar>
            <RestoreRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Restore</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            rpc.monitorServerHealth()
            handleClose()
          }}
        >
          <ListItemAvatar>
            <Refresh fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Refresh health metrics</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            rpc.refreshSystemInfo()
            handleClose()
          }}
        >
          <ListItemAvatar>
            <Refresh fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Refresh system info</ListItemText>
        </MenuItem>
        {debugMode && (
          <>
            <Divider textAlign="center">
              <Typography variant="caption" color="text.secondary">
                DEBUG
              </Typography>
            </Divider>
            <MenuItem
              dense
              onClick={() => {
                rpc.enqueueSleep(activeAccount, 5, 1, true)
                handleClose()
              }}
            >
              <ListItemAvatar>
                <Bedtime fontSize="small" />
              </ListItemAvatar>
              <ListItemText>Sleep 5s</ListItemText>
            </MenuItem>
            <MenuItem
              dense
              onClick={() => {
                rpc.enqueueSleep(activeAccount, 50, 10, true)
                handleClose()
              }}
            >
              <ListItemAvatar>
                <Bedtime fontSize="small" />
              </ListItemAvatar>
              <ListItemText>Sleep 50s</ListItemText>
            </MenuItem>
            <MenuItem
              dense
              onClick={() => {
                rpc.throwTestError()
                handleClose()
              }}
            >
              <ListItemAvatar>
                <BugReport fontSize="small" />
              </ListItemAvatar>
              <ListItemText>Trigger error</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  )
}
