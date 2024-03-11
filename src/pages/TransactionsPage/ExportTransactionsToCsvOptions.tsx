import { MoreHoriz } from "@mui/icons-material"
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material"
import React from "react"
import { Transaction } from "src/interfaces"

import { GetAllTransactions } from "./GetAllTransactions"
import { GetFilteredTransactions } from "./GetFilteredTransactions"

interface filteredData {
  transactionsFiltered: Transaction[]
}

export function ExportTransactionsToCsvOptions(props: filteredData) {
  const { transactionsFiltered } = props
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
      <Tooltip title="Export to .csv">
        <IconButton color="secondary" onClick={handleClick}>
          <MoreHoriz fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        <MenuItem
          dense
          onClick={() => {
            handleClose()
          }}
        >
          <GetAllTransactions />
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            handleClose()
          }}
        >
          <GetFilteredTransactions transactionsFiltered={transactionsFiltered} />
        </MenuItem>
      </Menu>
    </>
  )
}
