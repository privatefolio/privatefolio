import { MoreHoriz } from "@mui/icons-material"
import { IconButton, Menu, Stack, Tooltip } from "@mui/material"
import React from "react"
import { ActionId } from "src/AppActions"
import { ActionMenuItem } from "src/components/ActionMenuItem"
import { QuoteCurrencyToggle } from "src/components/QuoteCurrencyToggle"

export function TradeActions() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

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
        <ActionMenuItem dense id={ActionId.RECOMPUTE_TRADES} onFinish={handleClose} />
      </Menu>
    </Stack>
  )
}
