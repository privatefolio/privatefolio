import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  tabsClasses,
  TextField,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { FormEvent, useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { $accounts, $cloudAccounts, $localAccounts } from "src/stores/account-store"
import { $cloudAvailable } from "src/stores/cloud-user-store"
import { cloudEnabled, localServerEnabled } from "src/utils/environment-utils"
import { $cloudRpc, $localRpc } from "src/workers/remotes"

import { SectionTitle } from "../SectionTitle"
import { Tabs } from "../Tabs"

interface AddAccountDialogProps {
  open: boolean
  toggleOpen: () => void
}

export function AddAccountDialog(props: AddAccountDialogProps) {
  const { open, toggleOpen } = props
  const accounts = useStore($accounts)
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)

  const [accountType, setAccountType] = useState<"local" | "cloud">(
    localServerEnabled ? "local" : "cloud"
  )

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()

      if (!accounts) throw new Error("Accounts is not defined")

      const newAcc = name.trim()
      if (newAcc === "") {
        setError("This field cannot be empty")
        return
      }

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
        } else {
          const cloudRpc = $cloudRpc.get()
          if (!cloudRpc) throw new Error("RPC is not defined")
          await cloudRpc.createAccount(newAcc)
          await cloudRpc.getAccountNames().then($cloudAccounts.set)
        }
        setLoading(false)
        toggleOpen()
        setError("")
        setName("")
        navigate(`/u/${accounts.length}/import-data`)
      } catch (error) {
        console.error(error)
        setError(String(error))
        setLoading(false)
      }
    },
    [accounts, name, accountType, toggleOpen, navigate]
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
            <Tabs
              variant="fullWidth"
              // textColor="inherit"
              value={accountType}
              onChange={(event, newValue) => setAccountType(newValue)}
              sx={(theme) => ({
                background: "var(--mui-palette-background-default)",
                borderRadius: 1,
                margin: 0,
                minHeight: "unset",
                padding: 0.5,
                [`& .${tabsClasses.indicator}`]: {
                  background: "var(--mui-palette-background-paper)",
                  backgroundImage: "var(--mui-overlays-2)",
                  borderRadius: 0.5,
                  height: "100%",
                },
                [`& .${tabsClasses.flexContainer}`]: {
                  gap: 0.5,
                },
                [`& .${tabsClasses.flexContainer} > button`]: {
                  borderRadius: 0.75,
                  minHeight: 20,
                  padding: 0.5,
                  textTransform: "none !important",
                  transition: theme.transitions.create("color"),
                  willChange: "background",
                  zIndex: 2,
                },
                [`& .${tabsClasses.flexContainer} > button:hover`]: {
                  color: theme.palette.text.primary,
                },
              })}
            >
              <Tab label="Local" value="local" />
              <Tab label="Cloud" value="cloud" />
            </Tabs>
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
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
