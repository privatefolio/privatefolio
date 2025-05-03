import { Visibility, VisibilityOff } from "@mui/icons-material"
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
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Logo } from "src/components/Header/Logo"
import { SectionTitle } from "src/components/SectionTitle"

import { $auth, setPassword, unlockApp } from "../stores/auth-store"

export default function AuthPage() {
  const { isAuthenticated, errorMessage, loading, checked, needsSetup } = useStore($auth)
  const [password, setPasswordValue] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      console.log("Already authenticated, redirecting from Auth page...")
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

  const handleLogin = async () => {
    await unlockApp(password)
  }

  const handleSetup = async () => {
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

    await setPassword(password)
    await unlockApp(password)
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

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card variant="outlined">
        <CardHeader title={<Logo justifyContent="center" sx={{ margin: 1 }} />} />
        {needsSetup ? (
          <>
            <CardContent component={Stack} gap={2}>
              <Typography variant="body2" align="center" color="text.secondary" marginBottom={2}>
                Before you get started, set a password to secure the application. Once in a while,
                or when you lock the app, you will be prompted to enter the password again.
              </Typography>
              {errorMessage && (
                <Alert severity="error" variant="outlined">
                  {errorMessage}
                </Alert>
              )}
              {validationError && (
                <Alert severity="error" variant="outlined">
                  {validationError}
                </Alert>
              )}
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
            </CardContent>
            <CardActions sx={{ justifyContent: "center", p: 2 }}>
              <Button
                onClick={handleSetup}
                variant="contained"
                disabled={loading || !password || !confirmPassword}
                size="large"
              >
                {loading ? "Setting password..." : "Set password"}
              </Button>
            </CardActions>
          </>
        ) : (
          <>
            <CardContent component={Stack} gap={2}>
              <Typography variant="body2" align="center" color="text.secondary" marginBottom={2}>
                Please enter your password to access Privatefolio.
              </Typography>
              {errorMessage && (
                <Alert severity="error" variant="outlined">
                  {errorMessage}
                </Alert>
              )}
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
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  error={!!errorMessage}
                  disabled={loading}
                  InputProps={{
                    endAdornment: passwordAdornment,
                  }}
                />
              </div>
            </CardContent>
            <CardActions sx={{ justifyContent: "center", p: 2 }}>
              <Button
                onClick={handleLogin}
                variant="contained"
                disabled={loading || !password}
                size="large"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </CardActions>
          </>
        )}
      </Card>
    </Container>
  )
}
