import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  TextField,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { $cloudAccounts, $localAccounts } from "src/stores/account-store"
import { $cloudAvailable } from "src/stores/cloud-user-store"
import { cloudEnabled, localServerEnabled } from "src/utils/environment-utils"
import { logAndReportError } from "src/utils/error-utils"
import { $cloudRpc, $localRpc } from "src/workers/remotes"

import { SectionTitle } from "../SectionTitle"
import { TabsAlt } from "../TabsAlt"

interface AddAccountDialogProps {
  open: boolean
  toggleOpen: () => void
}

export function AddAccountDialog(props: AddAccountDialogProps) {
  const { open, toggleOpen } = props
  const localAccounts = useStore($localAccounts)
  const cloudAccounts = useStore($cloudAccounts)
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)

  const [accountType, setAccountType] = useState<"local" | "cloud">(
    localServerEnabled ? "local" : "cloud"
  )

  useEffect(() => {
    if (!open) {
      setName("")
      setError("")
    }
  }, [open])

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()

      const newAcc = name.trim()
      if (newAcc === "") {
        setError("This field cannot be empty")
        return
      }

      const accounts = accountType === "local" ? localAccounts : cloudAccounts
      if (!accounts) throw new Error("Accounts is not defined")

      const exists = accounts.find((x) => x === newAcc)
      if (exists) {
        setError("This name is already being used")
        return
      }

      setLoading(true)
      try {
        if (accountType === "local") {
          const localRpc = $localRpc.get()
          if (!localRpc) throw new Error("RPC is not defined")
          await localRpc.createAccount(newAcc)
          await localRpc.getAccountNames().then($localAccounts.set)
          navigate(`/l/${localAccounts?.length ?? 0}/import-data`)
        } else {
          const cloudRpc = $cloudRpc.get()
          if (!cloudRpc) throw new Error("RPC is not defined")
          await cloudRpc.createAccount(newAcc)
          await cloudRpc.getAccountNames().then($cloudAccounts.set)
          navigate(`/c/${cloudAccounts?.length ?? 0}/import-data`)
        }
        setLoading(false)
        toggleOpen()
        setError("")
        setName("")
      } catch (error) {
        logAndReportError(error, "AddAccountDialog.handleSubmit failed")
        setError(String(error))
        setLoading(false)
      }
    },
    [name, accountType, toggleOpen, navigate, localAccounts, cloudAccounts]
  )

  const cloudAvailable = useStore($cloudAvailable)

  const errorComponent = useMemo(() => {
    if (!localServerEnabled && accountType === "local") {
      return (
        <>
          Local accounts are not available in the browser. Download our desktop app for Windows,
          Mac, and Linux or {/* <MuiLink component={Link} to={"/cloud"}> */}
          login to PrivateCloud
          {/* </MuiLink> */}.
        </>
      )
    }
    if (!cloudEnabled && accountType === "cloud") {
      return <>Cloud accounts are incompatible with self-hosted deployments.</>
    }

    if (!cloudAvailable && accountType === "cloud") {
      return (
        <>
          {/* TODO9 */}
          {/* <MuiLink component={Link} to="/cloud"> */}
          Login to PrivateCloud
          {/* </MuiLink>{" "} */} to start using the cloud.
        </>
      )
    }
    return null
  }, [accountType, cloudAvailable])

  return (
    <Dialog open={open} onClose={toggleOpen}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <span>Add Account</span>
        </DialogTitle>
        <DialogContent sx={{ maxWidth: 360, minWidth: 360 }}>
          <Stack gap={2}>
            <TabsAlt value={accountType} onChange={(event, newValue) => setAccountType(newValue)}>
              <Tab label="Local" value="local" />
              <Tab label="Cloud" value="cloud" />
            </TabsAlt>
            <div>
              <SectionTitle>Name</SectionTitle>
              <TextField
                name="accountName"
                autoComplete="off"
                autoFocus
                required
                variant="outlined"
                fullWidth
                size="small"
                value={name}
                onChange={(event) => setName(event.target.value)}
                error={!!error}
                helperText={error}
              />
            </div>
            {errorComponent && <Alert severity="error">{errorComponent}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ paddingX: 3 }}>
          <Button onClick={toggleOpen} color="secondary" sx={{ paddingX: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading || !!errorComponent}
          >
            {loading ? "Creating…" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
