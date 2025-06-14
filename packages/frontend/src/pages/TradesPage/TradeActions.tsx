import { CalculateOutlined, MoreHoriz } from "@mui/icons-material"
import {
  IconButton,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { QuoteCurrencyToggle } from "src/components/QuoteCurrencyToggle"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

export function TradeActions() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  return (
    <Stack direction="row">
      <QuoteCurrencyToggle />
      <Tooltip title="Actions">
        <IconButton color="secondary" onClick={handleClick}>
          <MoreHoriz fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        <MenuItem
          dense
          onClick={() => {
            rpc.enqueueComputeTrades(activeAccount)
            handleClose()
          }}
        >
          <ListItemAvatar>
            <CalculateOutlined fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Recompute trades</ListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  )
}
