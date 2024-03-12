import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { FormEvent, useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { $accounts, $activeAccount } from "src/stores/account-store"

import { SectionTitle } from "./SectionTitle"

interface addAccountProps {
  modalOpen: boolean
  toggleModalOpen: () => void
}

export function AddAccount(props: addAccountProps) {
  const { modalOpen, toggleModalOpen } = props
  const accounts = useStore($accounts)
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const navigate = useNavigate()

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()

      const nameTrimmed = name.trim()
      if (nameTrimmed === "") {
        setError("This field cannot be empty")
        return
      }

      const exists = accounts.find((x) => x === nameTrimmed)
      if (exists) {
        setError("This name is already being used")
        return
      }

      $accounts.set([...accounts, nameTrimmed])
      toggleModalOpen()
      setError("")
      setName("")
      navigate(`/u/${accounts.length}/import-data`)
      // HACK: this is a hack to make sure the active account is set after the navigation
      setTimeout(() => {
        $activeAccount.set(nameTrimmed)
      }, 0)
    },
    [accounts, name, toggleModalOpen, navigate]
  )

  return (
    <Dialog open={modalOpen} onClose={toggleModalOpen}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <span>Add Account</span>
        </DialogTitle>
        <DialogContent sx={{ minWidth: 320 }}>
          <div>
            <SectionTitle>Name *</SectionTitle>
            <TextField
              autoFocus
              variant="outlined"
              fullWidth
              size="small"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={!!error}
              helperText={error}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleModalOpen} color="secondary" sx={{ paddingX: 2 }}>
            Cancel
          </Button>
          <Button type="submit" color="primary" sx={{ paddingX: 2 }}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
