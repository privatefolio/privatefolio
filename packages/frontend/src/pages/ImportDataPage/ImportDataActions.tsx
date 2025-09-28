import { CloudOffRounded, CloudRounded, MoreHoriz } from "@mui/icons-material"
import { IconButton, Menu, Stack, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { ActionId } from "src/AppActions"
import { ActionMenuItem } from "src/components/ActionMenuItem"
import { $hideInactiveConnections } from "src/stores/device-settings-store"

export function ImportDataActions({ currentTab }: { currentTab: string }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  const hideInactiveConnections = useStore($hideInactiveConnections)

  return (
    <Stack direction="row">
      {currentTab === "connections" && (
        <Tooltip
          title={hideInactiveConnections ? `Show only active connections` : `Show all connections`}
        >
          <IconButton
            color="secondary"
            onClick={() => {
              $hideInactiveConnections.set(!hideInactiveConnections)
            }}
          >
            {hideInactiveConnections ? (
              <CloudRounded fontSize="small" />
            ) : (
              <CloudOffRounded fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}
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
        <ActionMenuItem dense id={ActionId.BACKUP_ACCOUNT} onFinish={handleClose} />
        <ActionMenuItem dense id={ActionId.RESTORE_ACCOUNT} onFinish={handleClose} />
        <ActionMenuItem dense id={ActionId.RECOMPUTE_BALANCES} onFinish={handleClose} />
        <ActionMenuItem dense id={ActionId.RECOMPUTE_NETWORTH} onFinish={handleClose} />
        <ActionMenuItem dense id={ActionId.SYNC_ALL_CONNECTIONS} onFinish={handleClose} />
        <ActionMenuItem dense id={ActionId.EXPORT_ADDRESS_BOOK} onFinish={handleClose} />
        <ActionMenuItem dense id={ActionId.RESTORE_ADDRESS_BOOK} onFinish={handleClose} />
      </Menu>
    </Stack>
  )
}
