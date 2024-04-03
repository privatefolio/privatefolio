import {
  CalculateOutlined,
  DownloadRounded,
  MemoryRounded,
  MoreHoriz,
  PersonRemoveRounded,
  RestartAltRounded,
} from "@mui/icons-material"
import BackupRoundedIcon from "@mui/icons-material/BackupRounded"
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded"
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { $accountReset, $accounts, $activeAccount } from "src/stores/account-store"

import { useConfirm } from "../../hooks/useConfirm"
import { enqueueTask, TaskPriority } from "../../stores/task-store"
import {
  enquenceBackup,
  enqueueExportAppData,
  enqueueIndexDatabase,
  enqueueRecomputeBalances,
  enqueueRecomputeNetworth,
} from "../../utils/common-tasks"
import { clancy } from "../../workers/remotes"

export function ImportDataActions() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const confirm = useConfirm()

  // const debugMode = useStore($debugMode)

  const activeAccount = useStore($activeAccount)

  return (
    <>
      <Tooltip title="Database actions">
        <IconButton color="secondary" onClick={handleClick} sx={{ marginRight: -1 }}>
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
            enqueueExportAppData()
            handleClose()
          }}
        >
          <ListItemIcon>
            <DownloadRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export app data</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            // enquenceRestore()
            handleClose()
          }}
        >
          <ListItemIcon>
            <RestoreRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Restore data</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            enquenceBackup()
            handleClose()
          }}
        >
          <ListItemIcon>
            <BackupRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Backup</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            enqueueIndexDatabase()
            handleClose()
          }}
        >
          <ListItemIcon>
            <MemoryRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Index database</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            enqueueRecomputeBalances()
            handleClose()
          }}
        >
          <ListItemIcon>
            <CalculateOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Recompute balances</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            enqueueRecomputeNetworth()
            handleClose()
          }}
        >
          <ListItemIcon>
            <CalculateOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Recompute networth</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={async () => {
            const { confirmed } = await confirm({
              content: (
                <>
                  This action is permanent. All the data belonging to {activeAccount} will be lost.
                  <br />
                  <br />
                  Are you sure you wish to continue?
                </>
              ),
              title: "Reset account",
              variant: "warning",
            })
            if (confirmed) {
              enqueueTask({
                description: `Removing all data belonging to '${activeAccount}' from disk.`,
                function: async () => {
                  await clancy.resetAccount($activeAccount.get())
                  $accountReset.set(Math.random())
                },
                name: "Reset account",
                priority: TaskPriority.Ultra,
              })
              handleClose()
            }
          }}
        >
          <ListItemIcon>
            <RestartAltRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset account</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          disabled={activeAccount === "main"}
          onClick={async () => {
            const { confirmed } = await confirm({
              content: (
                <>
                  This action is permanent. All the data belonging to {activeAccount} will be lost.
                  <br />
                  <br />
                  Are you sure you wish to continue?
                </>
              ),
              title: "Delete account",
              variant: "warning",
            })
            if (confirmed) {
              enqueueTask({
                description: `Removing all data belonging to '${activeAccount}' from disk.`,
                function: async () => {
                  await clancy.deleteAccount(activeAccount)
                  const newAccounts = $accounts.get().filter((x) => x !== activeAccount)
                  $accounts.set(newAccounts)
                  if (newAccounts.length > 0) {
                    $activeAccount.set(newAccounts[newAccounts.length - 1])
                  } else {
                    $activeAccount.set("main")
                  }
                },
                name: "Delete account",
                priority: TaskPriority.High,
              })
              handleClose()
            }
          }}
        >
          <ListItemIcon>
            <PersonRemoveRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete account</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
