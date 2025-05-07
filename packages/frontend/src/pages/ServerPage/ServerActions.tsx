import { Bedtime, CalculateOutlined, MoreHoriz } from "@mui/icons-material"
import BackupRoundedIcon from "@mui/icons-material/BackupRounded"
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded"
import { IconButton, ListItemAvatar, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material"
import React from "react"
import { $activeAccount } from "src/stores/account-store"
import { handleBackupRequest } from "src/utils/backup-utils"
import { onRestoreRequest } from "src/utils/common-tasks"
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
            $rpc.get().enqueueSleep($activeAccount.get(), 1, 0.1)
            handleClose()
          }}
        >
          <ListItemAvatar>
            <Bedtime fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Sleep 1s</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            $rpc.get().enqueueSleep($activeAccount.get(), 10)
            handleClose()
          }}
        >
          <ListItemAvatar>
            <Bedtime fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Sleep 10s</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            handleClose()
            handleBackupRequest()
          }}
        >
          <ListItemAvatar>
            <BackupRoundedIcon fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Backup</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={() => onRestoreRequest(handleClose)}>
          <ListItemAvatar>
            <RestoreRoundedIcon fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Restore</ListItemText>
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
        <MenuItem
          dense
          onClick={() => {
            $rpc.get().enqueueRecomputeNetworth($activeAccount.get(), "user")
            handleClose()
          }}
        >
          <ListItemAvatar>
            <CalculateOutlined fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Recompute networth</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
