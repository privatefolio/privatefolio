import { Menu, MenuList, SwipeableDrawer, Typography } from "@mui/material"
import React from "react"
import { useBreakpoints } from "src/hooks/useBreakpoints"
import { noop } from "src/utils/utils"

import { Puller } from "../Puller"
import { AccountPickerContents } from "./AccountPickerContents"

export interface AccountPickerProps {
  anchorEl?: HTMLButtonElement
  handleClose: (actionTaken: boolean) => void
  open: boolean
  toggleAddAccount: () => void
}

export function AccountPicker(props: AccountPickerProps) {
  const { open, anchorEl, handleClose, toggleAddAccount } = props

  const { isMobile } = useBreakpoints()

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={() => handleClose(false)}
        onOpen={noop}
        disableSwipeToOpen
        sx={{
          "& .MuiPaper-root": {
            borderTopLeftRadius: "25px",
            borderTopRightRadius: "25px",
          },
        }}
      >
        <Puller />
        <Typography
          variant="subtitle1"
          letterSpacing="0.025rem"
          align="center"
          sx={{ marginTop: 2 }}
        >
          Accounts
        </Typography>
        <MenuList sx={{ paddingX: 2, paddingY: 1 }}>
          <AccountPickerContents
            toggleAddAccount={toggleAddAccount}
            onClose={() => handleClose(true)}
          />
        </MenuList>
      </SwipeableDrawer>
    )
  }

  return (
    <Menu
      keepMounted
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        horizontal: "left",
        vertical: "bottom",
      }}
      transformOrigin={{
        horizontal: "left",
        vertical: "top",
      }}
      sx={{
        marginTop: 0.5,
        visibility: open ? "visible" : "hidden", // FIXME TODO1 why is this needed?
      }}
      slotProps={{ paper: { sx: { width: 267 } } }}
    >
      <AccountPickerContents
        toggleAddAccount={toggleAddAccount}
        onClose={() => handleClose(true)}
      />
    </Menu>
  )
}
