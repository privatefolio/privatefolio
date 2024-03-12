import { Add } from "@mui/icons-material"
import {
  IconButton,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Stack,
  styled,
  SwipeableDrawer,
  Tooltip,
  Typography,
} from "@mui/material"
import { grey } from "@mui/material/colors"
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

const Puller = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.mode === "light" ? grey[300] : grey[900],
  borderRadius: 3,
  height: 6,
  left: "calc(50% - 15px)",
  position: "absolute",
  top: 8,
  width: 30,
}))

export function AccountPickerDrawer() {
  const { value: open, toggle: toggleOpen } = useBoolean(false)
  const accounts = useStore($accounts)
  const activeAccount = useStore($activeAccount)
  const accountReset = useStore($accountReset)

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
    <>
      <Tooltip title="Accounts">
        <IconButton onClick={toggleOpen} sx={{ marginRight: -1 }}>
          <AccountAvatar alt={activeAccount} size="small" />
        </IconButton>
      </Tooltip>
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={toggleOpen}
        onOpen={toggleOpen}
        disableSwipeToOpen
        sx={{
          "& .MuiPaper-root": {
            borderTopLeftRadius: "25px",
            borderTopRightRadius: "25px",
          },
        }}
      >
        <Stack paddingX={2} paddingY={1} gap={2} sx={{ overflowX: "hidden" }}>
          <Puller />
          <Typography
            variant="subtitle1"
            letterSpacing="0.025rem"
            align="center"
            sx={{ paddingTop: "1rem" }}
          >
            Accounts
          </Typography>
          <Stack gap={0.5}>
            {accounts.map((x, index) => (
              <NavMenuItem
                value={x}
                key={x}
                onClick={() => {
                  $activeAccount.set(x)
                  toggleOpen()
                }}
                to={`/u/${index}/${currentPath}`}
                label={x}
                avatar={<AccountAvatar alt={x} src={x} />}
              />
            ))}
          </Stack>
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
          <AddAccount modalOpen={modalOpen} toggleModalOpen={toggleModalOpen} />
        </Stack>
      </SwipeableDrawer>
    </>
  )
}
