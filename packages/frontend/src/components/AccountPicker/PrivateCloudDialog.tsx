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
import React, { FormEvent, useCallback, useEffect, useState } from "react"
import { login, signUp } from "src/stores/cloud-account-store"

import { SectionTitle } from "../SectionTitle"
import { Tabs } from "../Tabs"

interface AddAccountDialogProps {
  open: boolean
  toggleOpen: () => void
}

export function PrivateCloudDialog(props: AddAccountDialogProps) {
  const { open, toggleOpen } = props

  const [form, setForm] = useState<"login" | "sign-up">("login")

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState("")

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()

      const email = (event.target as any).email.value as string
      const password = (event.target as any).password.value as string

      setLoading(true)
      try {
        if (form === "sign-up") {
          await signUp(email, password)
        } else {
          await login(email, password)
        }
        setLoading(false)
        toggleOpen()
      } catch (error) {
        console.error(error)
        if (String(error).includes("UNIQUE constraint failed")) {
          setApiError("Email already in use.")
        } else {
          setApiError(String(error))
        }
        setLoading(false)
      }
    },
    [form, toggleOpen]
  )

  useEffect(() => {
    setApiError("")
    setForm("login")
  }, [open])

  return (
    <Dialog open={open} onClose={toggleOpen}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <span>PrivateCloud™</span>
        </DialogTitle>
        <DialogContent sx={{ minWidth: 360 }}>
          <Stack gap={2}>
            <Tabs
              variant="fullWidth"
              // textColor="inherit"
              value={form}
              onChange={(event, newValue) => setForm(newValue)}
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
              <Tab label="Login" value="login" />
              <Tab label="Sign up" value="sign-up" />
            </Tabs>
            <div>
              <SectionTitle>Email</SectionTitle>
              <TextField
                name="email"
                type="email"
                autoComplete="email"
                required
                variant="outlined"
                fullWidth
                size="small"
                // InputProps={{
                //   endAdornment: (
                //     <InputAdornment position="end">
                //       {checkingEmail ? (
                //         <CircularSpinner size={16} />
                //       ) : emailFound ? (
                //         <Check style={{ color: "green" }} fontSize="small" />
                //       ) : null}
                //     </InputAdornment>
                //   ),
                // }}
              />
            </div>
            <div>
              <SectionTitle>Password</SectionTitle>
              <TextField
                name="password"
                type="password"
                autoComplete={form === "sign-up" ? "new-password" : "current-password"}
                required
                variant="outlined"
                fullWidth
                size="small"
                inputProps={{
                  pattern: ".{6,}",
                  title: "Must have at least 6 characters.",
                }}
              />
            </div>
            {apiError && (
              <Alert severity="error" variant="standard">
                {apiError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleOpen} color="secondary" sx={{ paddingX: 2 }}>
            Cancel
          </Button>
          <Button type="submit" color="primary" sx={{ paddingX: 2 }} disabled={loading}>
            {form === "login" ? "Log in" : "Sign up"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
