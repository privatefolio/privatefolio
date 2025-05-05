import { CalculateOutlined, MoreHoriz, SyncRounded } from "@mui/icons-material"
import BackupRoundedIcon from "@mui/icons-material/BackupRounded"
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded"
import { IconButton, ListItemAvatar, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material"
import React from "react"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { handleBackupRequest, handleRestoreRequest } from "src/utils/backup-utils"
import { requestFile } from "src/utils/utils"
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
            handleBackupRequest()
            handleClose()
          }}
        >
          <ListItemAvatar>
            <BackupRoundedIcon fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Backup</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={async () => {
            const files = await requestFile([".zip"], false)
            await $rpc.get().resetAccount($activeAccount.get())
            const fileRecord = await handleRestoreRequest(files[0])
            await $rpc.get().restoreAccount($activeAccount.get(), fileRecord)
            handleClose()
          }}
        >
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
        <MenuItem
          dense
          onClick={() => {
            $rpc.get().enqueueSyncAllConnections($activeAccount.get(), "user", $debugMode.get())
            handleClose()
          }}
        >
          <ListItemAvatar>
            <SyncRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Sync all connections</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
