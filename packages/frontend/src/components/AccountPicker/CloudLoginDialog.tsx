import { Visibility, VisibilityOff } from "@mui/icons-material"
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
  Stack,
  Tab,
  tabsClasses,
  TextField,
} from "@mui/material"
import React, { FormEvent, useCallback, useEffect, useState } from "react"
import { handleLogin, handleSignUp } from "src/stores/cloud-user-store"

import { LogoText } from "../Header/LogoText"
import { SectionTitle } from "../SectionTitle"
import { Tabs } from "../Tabs"

interface AddAccountDialogProps {
  open: boolean
  toggleOpen: () => void
}

export function CloudLoginDialog(props: AddAccountDialogProps) {
  const { open, toggleOpen } = props

  const [form, setForm] = useState<"login" | "sign-up">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [validationError, setValidationError] = useState("")

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show)
  }

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      setValidationError("")

      const email = (event.target as any).email.value as string
      const password = (event.target as any).password.value as string

      if (form === "sign-up") {
        const confirmPassword = (event.target as any).confirmPassword?.value as string
        if (password !== confirmPassword) {
          setValidationError("Passwords do not match.")
          return
        }
      }

      setLoading(true)
      try {
        if (form === "sign-up") {
          await handleSignUp(email, password)
        } else {
          await handleLogin(email, password)
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
    setValidationError("")
    setForm("login")
    setShowPassword(false)
  }, [open])

  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton
        aria-label="toggle password visibility"
        onClick={handleClickShowPassword}
        onMouseDown={handleMouseDownPassword}
        edge="end"
        size="small"
        color="secondary"
      >
        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  )

  return (
    <Dialog open={open} onClose={toggleOpen}>
      <form onSubmit={handleSubmit}>
        <LogoText color="primary" sx={{ paddingTop: 2, paddingX: 3 }}>
          PrivateCloud™
        </LogoText>
        <DialogContent sx={{ minWidth: 380 }}>
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
                type={showPassword ? "text" : "password"}
                autoComplete={form === "sign-up" ? "new-password" : "current-password"}
                required
                variant="outlined"
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: passwordAdornment,
                }}
                inputProps={{
                  pattern: ".{6,}",
                  title: "Must have at least 6 characters.",
                }}
              />
            </div>
            {form === "sign-up" && (
              <div>
                <SectionTitle>Confirm Password</SectionTitle>
                <TextField
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  variant="outlined"
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: passwordAdornment,
                  }}
                  inputProps={{
                    pattern: ".{6,}",
                    title: "Must have at least 6 characters.",
                  }}
                />
              </div>
            )}
            {validationError && <Alert severity="error">{validationError}</Alert>}
            {apiError && <Alert severity="error">{apiError}</Alert>}
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
            sx={{ paddingX: 2 }}
            disabled={loading}
          >
            {form === "login" ? "Log in" : "Sign up"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
