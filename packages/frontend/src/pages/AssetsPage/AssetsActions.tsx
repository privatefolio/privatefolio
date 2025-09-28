import {
  AttachMoneyRounded,
  MoreHoriz,
  VisibilityOffRounded,
  VisibilityRounded,
  Workspaces,
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
import React from "react"
import { ActionId } from "src/AppActions"
import { ActionMenuItem } from "src/components/ActionMenuItem"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { $hideUnlisted } from "src/stores/device-settings-store"
import { $rpc } from "src/workers/remotes"

export function AssetsActions() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const debugMode = useStore($debugMode)
  const hideUnlisted = useStore($hideUnlisted)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  return (
    <Stack direction="row">
      <Tooltip title={hideUnlisted ? "Show unlisted assets" : "Hide unlisted assets"}>
        <IconButton
          color="secondary"
          onClick={() => {
            $hideUnlisted.set(!hideUnlisted)
          }}
        >
          {hideUnlisted ? (
            <VisibilityOffRounded fontSize="small" />
          ) : (
            <VisibilityRounded fontSize="small" />
          )}
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
            rpc.enqueueFetchPrices(activeAccount, "user")
            handleClose()
          }}
        >
          <ListItemAvatar>
            <AttachMoneyRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Fetch asset prices</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            rpc.enqueueRefetchAssets(activeAccount, "user")
            handleClose()
          }}
        >
          <ListItemAvatar>
            <Workspaces fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Refetch all assets</ListItemText>
        </MenuItem>
        {debugMode && (
          <>
            <Divider textAlign="center">
              <Typography variant="caption" color="text.secondary">
                DEBUG
              </Typography>
            </Divider>
            <ActionMenuItem dense id={ActionId.DELETE_ASSET_PRICES} onFinish={handleClose} />
            <ActionMenuItem dense id={ActionId.DELETE_ASSET_PREFERENCES} onFinish={handleClose} />
          </>
        )}
      </Menu>
    </Stack>
  )
}
