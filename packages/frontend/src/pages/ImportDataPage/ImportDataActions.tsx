import { CalculateOutlined, MoreHoriz, SyncRounded } from "@mui/icons-material"
import BackupRoundedIcon from "@mui/icons-material/BackupRounded"
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded"
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded"
import { IconButton, ListItemAvatar, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material"
import { enqueueSnackbar } from "notistack"
import React from "react"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { blobToBase64, downloadFile, requestFile } from "src/utils/utils"
import { $rest, $rpc } from "src/workers/remotes"

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
            enqueueSnackbar("Backup started", { persist: true, variant: "info" })
            handleClose()
            const accountName = $activeAccount.get()
            const fileRecord = await $rpc.get().backupAccount(accountName)
            fileRecord
              ? enqueueSnackbar(
                  <span>
                    The Backup is ready to download
                    <IconButton
                      aria-label="download"
                      color="inherit"
                      onClick={async () => {
                        const params = new URLSearchParams({
                          accountName: $activeAccount.get(),
                          fileId: fileRecord.id.toString(),
                        })

                        const response = await fetch(`${$rest.get()}/download?${params.toString()}`)

                        const blob = await response.blob()

                        downloadFile(blob, fileRecord.name)
                      }}
                    >
                      <DownloadRoundedIcon />
                    </IconButton>
                  </span>,
                  {
                    autoHideDuration: 50000,
                    variant: "success",
                  }
                )
              : enqueueSnackbar("An error occurred while creating the file", {
                  autoHideDuration: 10000,
                  variant: "error",
                })
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
            const accountName = $activeAccount.get()
            const files = await requestFile([".zip"], false)
            handleClose()
            try {
              console.log("restore start")
              // await $rpc.get().enqueueRestore(accountName, await blobToBase64(files[0]), "user")
              await $rpc.get().restoreAccount(accountName, await blobToBase64(files[0]))
              console.log("restore finish")
            } catch (e) {
              console.error(e)
            }
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
