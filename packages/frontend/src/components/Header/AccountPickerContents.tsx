import { Add, LockOutlined, PersonRemoveRounded, RestartAltRounded } from "@mui/icons-material"
import { Divider, ListItemAvatar, ListItemText, MenuItem } from "@mui/material"
import { useStore } from "@nanostores/react"
import { enqueueSnackbar } from "notistack"
import React, { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useConfirm } from "src/hooks/useConfirm"
import {
  $activeAccount,
  $activeAccountType,
  $cloudAccounts,
  $localAccounts,
} from "src/stores/account-store"
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

  const localAccounts = useStore($localAccounts)
  const cloudAccounts = useStore($cloudAccounts)

  const location = useLocation()
  const { pathname, search } = location
  const currentPath = pathname.split("/").slice(3).join("/")

  const confirm = useConfirm()
  const activeAccount = useStore($activeAccount)
  const activeAccountType = useStore($activeAccountType)
  const navigate = useNavigate()

  const rpc = useStore($rpc)

  const [deleting, setDeleting] = useState(false)

  const allAccounts = useMemo<
    {
      accountIndex: number
      accountName: string
      type: "local" | "cloud"
    }[]
  >(
    () => [
      ...(localAccounts ?? []).map((x, index) => ({
        accountIndex: index,
        accountName: x,
        type: "local" as const,
      })),
      ...(cloudAccounts ?? []).map((x, index) => ({
        accountIndex: index,
        accountName: x,
        type: "cloud" as const,
      })),
    ],
    [localAccounts, cloudAccounts]
  )

  if (!localAccounts && !cloudAccounts) return null
  if (!activeAccount) return null

  return (
    <>
      {allAccounts.map((x) => (
        <NavMenuItem
          key={`${x.type}-${x.accountName}`}
          value={`${x.type}-${x.accountName}`}
          className={
            activeAccount === x.accountName && activeAccountType === x.type
              ? "Mui-selected"
              : undefined
          }
          onClick={onClose}
          to={`/${x.type === "local" ? "l" : "c"}/${x.accountIndex}/${currentPath}${search}`}
          label={x.accountName}
          avatar={<AccountAvatar alt={x.accountName} type={x.type} />}
          aria-label={`Switch to account ${x.accountName}`}
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
            await rpc.resetAccount(activeAccount)
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
            rpc
              .deleteAccount(activeAccount)
              .then(() => {
                setDeleting(false)
                onClose()
                navigate("/")
              })
              .catch((error) => {
                console.error(error)
                setDeleting(false)
                enqueueSnackbar(error.message, { variant: "error" })
              })
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
