import {
  BackupRounded,
  CalculateOutlined,
  CloudSyncRounded,
  MoreHoriz,
  RestoreRounded,
} from "@mui/icons-material"
import { IconButton, ListItemAvatar, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { handleBackupRequest, onRestoreRequest } from "src/utils/backup-utils"
import { $rpc } from "src/workers/remotes"

export function ImportDataActions() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
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
          onClick={async () => {
            handleBackupRequest(rpc, activeAccount)
            handleClose()
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
            rpc.enqueueRecomputeBalances(activeAccount, "user")
            handleClose()
          }}
        >
          <ListItemAvatar>
            <CalculateOutlined fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Recompute balances</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            rpc.enqueueRecomputeNetworth(activeAccount, "user")
            handleClose()
          }}
        >
          <ListItemAvatar>
            <CalculateOutlined fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Recompute networth</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            rpc.enqueueSyncAllConnections(activeAccount, "user", $debugMode.get())
            handleClose()
          }}
        >
          <ListItemAvatar>
            <CloudSyncRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Sync all connections</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
