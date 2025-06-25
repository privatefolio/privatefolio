import { ExpandMore } from "@mui/icons-material"
import { Button, MenuItem, Stack, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useState } from "react"
import { useBoolean } from "src/hooks/useBoolean"
import { $activeAccount, $activeAccountType } from "src/stores/account-store"
import { noop } from "src/utils/utils"

import { AccountAvatar } from "../AccountAvatar"
import { AddAccountDialog } from "../AccountPicker/AddAccountDialog"
import { Truncate } from "../Truncate"
import { AccountPicker } from "./AccountPicker"

export function AccountPickerButton(props: { onClose?: () => void }) {
  const { onClose: closeParentDrawer = noop } = props
  const activeAccount = useStore($activeAccount)
  const activeAccountType = useStore($activeAccountType)

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement>()
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = (actionTaken: boolean) => {
    setAnchorEl(undefined)
    if (actionTaken) closeParentDrawer()
  }
  const open = Boolean(anchorEl)

  const { value: addAccountOpen, toggle: toggleAddAccount } = useBoolean(false)

  return (
    <>
      <Tooltip title="Switch account">
        <MenuItem
          component={Button}
          onClick={handleClick}
          color="secondary"
          sx={{
            "@media (min-width: 990px) and (max-width: 1836px)": {
              "& .MuiAvatar-root": {
                height: 24,
                width: 24,
              },
              "& .MuiStack-root": {
                flexDirection: "column",
                gap: 0.5,
              },
              "& svg": { display: "none" },
              marginY: 0,
            },
            borderRadius: 0.5,
            gap: 0.5,
            justifyContent: "flex-start",
            marginY: 1.5,
            paddingLeft: 2,
            paddingRight: 2,
            paddingY: 1,
            textTransform: "none",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            sx={{ maxWidth: "100%", overflow: "hidden" }}
            gap={2}
          >
            <AccountAvatar alt={activeAccount} size="small" type={activeAccountType} />
            <Typography
              variant="subtitle1"
              letterSpacing="0.025rem"
              component={Truncate}
              // color="text.primary"
              fontWeight={700}
              sx={{ lineHeight: 1, maxWidth: "100%" }}
            >
              {activeAccount}
            </Typography>
          </Stack>
          <ExpandMore fontSize="small" sx={{ flex: "0 0 20px" }} />
        </MenuItem>
      </Tooltip>
      <AccountPicker
        open={open}
        anchorEl={anchorEl}
        handleClose={(actionTaken) => handleClose(actionTaken)}
        toggleAddAccount={toggleAddAccount}
      />
      <AddAccountDialog open={addAccountOpen} toggleOpen={toggleAddAccount} />
    </>
  )
}
