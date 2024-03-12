import { Add } from "@mui/icons-material"
import {
  Box,
  IconButton,
  InputBase,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Tooltip,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { proxy } from "comlink"
import React, { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useBoolean } from "src/hooks/useBoolean"
import { $accountReset, $accounts, $activeAccount } from "src/stores/account-store"
import { computeMetadata, computeMetadataDebounced } from "src/stores/metadata-store"
import { clancy } from "src/workers/remotes"

import { AccountAvatar } from "../AccountAvatar"
import { AddAccount } from "../AddAccount"
import { NavMenuItem } from "../NavMenuItem"

export function AccountPicker() {
  const accounts = useStore($accounts)
  const activeAccount = useStore($activeAccount)
  const accountReset = useStore($accountReset)
  const { value: open, toggle: toggleOpen } = useBoolean(false)

  const location = useLocation()
  const { pathname } = location
  const currentPath = pathname.split("/").slice(3).join("/")

  useEffect(() => {
    computeMetadata()
    const unsubscribePromise = clancy.subscribeToAuditLogs(
      proxy(computeMetadataDebounced),
      activeAccount
    )

    return () => {
      unsubscribePromise.then((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [accountReset, activeAccount])

  const { value: modalOpen, toggle: toggleModalOpen } = useBoolean(false)

  return (
    <Box>
      <Tooltip title="Accounts">
        <IconButton onClick={toggleOpen} sx={{ marginRight: -1 }}>
          <AccountAvatar alt={activeAccount} size="small" />
        </IconButton>
      </Tooltip>
      <Select
        open={open}
        onClose={toggleOpen}
        onOpen={toggleOpen}
        value={activeAccount}
        IconComponent={() => false}
        input={
          <InputBase sx={{ height: 36, position: "absolute", visibility: "hidden", width: 16 }} />
        }
        MenuProps={{
          anchorOrigin: {
            horizontal: "right",
            vertical: "bottom",
          },
          transformOrigin: {
            horizontal: "right",
            vertical: "top",
          },
        }}
      >
        {accounts.map((x, index) => (
          <NavMenuItem
            value={x}
            key={x}
            onClick={() => {
              $activeAccount.set(x)
            }}
            to={`/u/${index}/${currentPath}`}
            label={x}
            avatar={<AccountAvatar alt={x} src={x} />}
          />
        ))}
        <MenuItem sx={{ minWidth: 240 }} onClick={toggleModalOpen}>
          <ListItemAvatar
            sx={{
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
              marginRight: 2,
              minWidth: 28,
            }}
          >
            <Add fontSize="medium" color="secondary" />
          </ListItemAvatar>
          <ListItemText primary={"Add account"} />
        </MenuItem>
      </Select>

      {/* <Portal>
        <Drawer
          // variant="permanent"
          anchor="left"
          keepMounted
          open={false} // </>={open}
          // transitionDuration={500}
          // TODO this should have a delay
          // onClose={toggleOpen}
          PaperProps={{
            sx: {
              height: "fit-content",
              // left: 4,
              marginY: "auto",
              maxHeight: 500,
              paddingX: 1.5,
              paddingY: 2,
              top: 124,
            },
          }}
        >
          <Stack gap={1}>
            {accounts.map((x) => (
              <Button
                key={x}
                sx={{
                  minWidth: "unset",
                  padding: 0,
                }}
                onClick={() => {
                  $activeAccount.set(x)
                }}
              >
                <Avatar
                  sx={(theme) => ({
                    "&:hover": {
                      borderRadius: 2,
                    },
                    // borderRadius: activeAccount === x ? 2 : undefined,
                    height: 48,
                    transition: theme.transitions.create("border-radius"),
                    width: 48,
                  })}
                />
              </Button>
            ))}
          </Stack>
        </Drawer>
      </Portal> */}
      <AddAccount modalOpen={modalOpen} toggleModalOpen={toggleModalOpen} />
    </Box>
  )
}
