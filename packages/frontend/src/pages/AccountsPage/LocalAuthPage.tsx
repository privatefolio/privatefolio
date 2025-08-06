import { Visibility, VisibilityOff, WifiOffRounded } from "@mui/icons-material"
import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { FormEvent, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogoText } from "src/components/Header/LogoText"
import { SectionTitle } from "src/components/SectionTitle"
import { isElectron, restartBackend } from "src/utils/electron-utils"
import { $localRest } from "src/workers/remotes"

import { $localAuth, setPassword, unlockApp } from "../../stores/auth-store"

export default function LocalAuthPage() {
  const { isAuthenticated, errorMessage, loading, checked, needsSetup } = useStore($localAuth)
  const [password, setPasswordValue] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      console.log("Already authenticated, redirecting from Auth page…")
      navigate("/", { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordValue(event.target.value)
    if (validationError) setValidationError(null)
  }

  const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value)
    if (validationError) setValidationError(null)
  }

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show)
  }

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  const handleUnlock = async (event: FormEvent) => {
    event.preventDefault()
    await unlockApp(password, $localAuth, $localRest.get())
  }

  const handleSetup = async (event: FormEvent) => {
    event.preventDefault()
    setValidationError(null)
    if (!password) {
      setValidationError("Password cannot be empty.")
      return
    }
    if (password.length < 4) {
      setValidationError("Password must be at least 4 characters long.")
      return
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.")
      return
    }

    await setPassword(password, $localAuth, $localRest.get())
    await unlockApp(password, $localAuth, $localRest.get())
  }

  if (!checked) {
    return null
  }

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

  if (errorMessage?.includes("Cannot connect to server")) {
    return (
      <Container maxWidth="xs" sx={{ marginTop: 8 }} disableGutters>
        <CardContent component={Stack} gap={2} alignItems="center">
          <WifiOffRounded sx={{ fontSize: 100 }} />
          <Alert severity="error">{errorMessage}</Alert>
          {isElectron && (
            <Button variant="contained" onClick={restartBackend}>
              Restart backend
            </Button>
          )}
        </CardContent>
      </Container>
    )
  }

  return (
    <Container maxWidth="xs" sx={{ marginTop: 8 }} disableGutters>
      <form onSubmit={needsSetup ? handleSetup : handleUnlock}>
        <Card variant="outlined">
          <CardHeader title={<LogoText color="primary" />} />
          {needsSetup ? (
            <>
              <CardContent component={Stack} gap={2}>
                <Typography variant="body2" color="text.secondary">
                  Before you get started, set a password to secure the application. Once in a while,
                  or when you lock the app, you will be prompted to enter the password again.
                </Typography>
                <div>
                  <SectionTitle>Password</SectionTitle>
                  <TextField
                    autoFocus
                    required
                    size="small"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    variant="outlined"
                    value={password}
                    onChange={handlePasswordChange}
                    error={!!validationError || !!errorMessage}
                    disabled={loading}
                    InputProps={{
                      endAdornment: passwordAdornment,
                    }}
                  />
                </div>
                <div>
                  <SectionTitle>Confirm Password</SectionTitle>
                  <TextField
                    required
                    size="small"
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    variant="outlined"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    error={!!validationError || !!errorMessage}
                    disabled={loading}
                    InputProps={{
                      endAdornment: passwordAdornment,
                    }}
                  />
                </div>
                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
                {validationError && <Alert severity="error">{validationError}</Alert>}
              </CardContent>
              <CardActions sx={{ paddingX: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !password || !confirmPassword}
                >
                  {loading ? "Setting password…" : "Set password"}
                </Button>
              </CardActions>
            </>
          ) : (
            <>
              <CardContent component={Stack} gap={2}>
                <Typography variant="body2" color="text.secondary">
                  Please enter your password to access Privatefolio.
                </Typography>
                <div>
                  <SectionTitle>Password</SectionTitle>
                  <TextField
                    autoFocus
                    required
                    size="small"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    variant="outlined"
                    value={password}
                    onChange={handlePasswordChange}
                    error={!!errorMessage}
                    disabled={loading}
                    InputProps={{
                      endAdornment: passwordAdornment,
                    }}
                  />
                </div>
                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
              </CardContent>
              <CardActions sx={{ paddingX: 3 }}>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? "Unlocking…" : "Unlock"}
                </Button>
              </CardActions>
            </>
          )}
        </Card>
      </form>
    </Container>
  )
}
