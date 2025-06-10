import { Add, LockOutlined, PersonRemoveRounded, RestartAltRounded } from "@mui/icons-material"
import { Divider, ListItemAvatar, ListItemText, MenuItem } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useState } from "react"
import { useLocation } from "react-router-dom"
import { useConfirm } from "src/hooks/useConfirm"
import { $accounts, $activeAccount } from "src/stores/account-store"
import { $localAuth, lockApp } from "src/stores/auth-store"
import { $localRest, $rpc } from "src/workers/remotes"

import { AccountAvatar } from "../AccountAvatar"
import { NavMenuItem } from "../NavMenuItem"

type AccountPickerContentsProps = {
  onClose: () => void
  toggleAddAccount: () => void
}

export function AccountPickerContents(props: AccountPickerContentsProps) {
  const { toggleAddAccount, onClose } = props

  const accounts = useStore($accounts)

  const location = useLocation()
  const { pathname, search } = location
  const currentPath = pathname.split("/").slice(3).join("/")

  const confirm = useConfirm()
  const activeAccount = useStore($activeAccount)
  // const navigate = useNavigate()

  const [deleting, setDeleting] = useState(false)

  if (!accounts) return null
  if (!activeAccount) return null

  return (
    <>
      {accounts.map((x, index) => (
        <NavMenuItem
          key={x}
          value={x}
          className={activeAccount === x ? "Mui-selected" : undefined}
          onClick={() => {
            $activeAccount.set(x)
            onClose()
          }}
          to={`/u/${index}/${currentPath}${search}`}
          label={x}
          avatar={<AccountAvatar alt={x} />}
          aria-label={`Switch to account ${index}`}
        />
      ))}
      <Divider />
      <MenuItem
        aria-label="Add account"
        onClick={() => {
          toggleAddAccount()
          onClose()
        }}
      >
        <ListItemAvatar>
          <Add fontSize="small" />
        </ListItemAvatar>
        <ListItemText primary="Add account" />
      </MenuItem>
      <MenuItem
        aria-label="Reset account"
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
            await $rpc.get().resetAccount($activeAccount.get())
            // navigate(`/u/${$activeIndex.get()}/import-data`)
            onClose()
          }
        }}
      >
        <ListItemAvatar>
          <RestartAltRounded fontSize="small" />
        </ListItemAvatar>
        <ListItemText>Reset account</ListItemText>
      </MenuItem>
      <MenuItem
        aria-label="Delete account"
        disabled={deleting}
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
            setDeleting(true)
            await $rpc.get().deleteAccount($activeAccount.get())
            setDeleting(false)
            onClose()
          }
        }}
      >
        <ListItemAvatar>
          <PersonRemoveRounded fontSize="small" />
        </ListItemAvatar>
        <ListItemText>{deleting ? "Deleting account…" : "Delete account"} </ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem
        aria-label="Lock app"
        onClick={() => {
          lockApp($localAuth, $localRest.get())
        }}
      >
        <ListItemAvatar>
          <LockOutlined fontSize="small" />
        </ListItemAvatar>
        <ListItemText>Lock app</ListItemText>
      </MenuItem>
    </>
  )
}
