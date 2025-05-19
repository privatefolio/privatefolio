import { Add, Cloud } from "@mui/icons-material"
import {
  AppBar,
  Avatar,
  Button,
  Container,
  Fade,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AccountAvatar, SIZE_MAP } from "src/components/AccountAvatar"
import { AddAccountDialog } from "src/components/AccountPicker/AddAccountDialog"
import { CloudLoginDialog } from "src/components/AccountPicker/CloudLoginDialog"
import { CircularSpinner } from "src/components/CircularSpinner"
import { LogoText } from "src/components/Header/LogoText"
import { StaggeredList } from "src/components/StaggeredList"
import { useBoolean } from "src/hooks/useBoolean"
import { $accounts, $activeAccount, $activeIndex } from "src/stores/account-store"
import { $cloudUser } from "src/stores/cloud-user-store"
import { SerifFont } from "src/theme"
import { SPRING_CONFIGS } from "src/utils/utils"

export default function AccountsPage() {
  useEffect(() => {
    document.title = `Accounts - Privatefolio`
  }, [])

  const accounts = useStore($accounts)
  const activeIndex = useStore($activeIndex)

  const { value: addAccountOpen, toggle: toggleAddAccount } = useBoolean(false)
  const { value: loginOpen, toggle: toggleLoginOpen } = useBoolean(false)

  const user = useStore($cloudUser)

  useEffect(() => {
    if (activeIndex !== undefined) {
      $activeAccount.set("")
    }
  }, [activeIndex])

  const [showAppBar, setShowAppBar] = useState(false)
  useEffect(() => {
    const firstAccount = document.getElementById("account-0")
    firstAccount?.focus()
    const timeout = setTimeout(() => {
      setShowAppBar(true)
    }, 250)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const firstAccount = document.getElementById("account-0")
      firstAccount?.focus()
    }, 50)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backdropFilter: "none !important",
          background: "none !important",
          border: "none",
          color: "var(--mui-palette-primary-main) !important",
          zIndex: 1001,
        }}
      >
        <Fade in={showAppBar} timeout={400}>
          <Toolbar disableGutters>
            <Container
              disableGutters
              maxWidth="md"
              sx={{ marginTop: -0.5, paddingX: { xs: 2 }, paddingY: 0, position: "relative" }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  height: "100%",
                  paddingX: {
                    sm: 2,
                    xs: 1,
                  },
                  width: "100%",
                }}
              >
                <Button
                  size="small"
                  variant="text"
                  href="https://www.privatefolio.app"
                  target="_blank"
                  sx={{ marginX: -2, paddingX: 2 }}
                >
                  <LogoText />
                </Button>
                {user !== undefined && !user && (
                  <Button
                    color="secondary"
                    size="small"
                    endIcon={<Cloud />}
                    variant="outlined"
                    onClick={toggleLoginOpen}
                  >
                    Login to PrivateCloud
                  </Button>
                )}
                {user !== undefined && user && (
                  <Tooltip title="View PrivateCloud account">
                    <Button
                      color="secondary"
                      size="small"
                      endIcon={<Cloud />}
                      variant="outlined"
                      component={Link}
                      to="/privatecloud"
                    >
                      {user.email}
                    </Button>
                  </Tooltip>
                )}
              </Stack>
            </Container>
          </Toolbar>
        </Fade>
      </AppBar>
      <Stack
        sx={{
          background: "var(--mui-palette-background-default)",
          height: "calc(100vh - 16px)",
          left: 0,
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 1000,
        }}
        alignItems="center"
        justifyContent="center"
      >
        {!accounts ? (
          <Stack alignItems="center" justifyContent="center" gap={1}>
            <CircularSpinner />
          </Stack>
        ) : (
          <StaggeredList
            gap={2}
            secondary
            config={SPRING_CONFIGS.quick}
            delay={0}
            direction="row"
            alignItems="flex-start"
            justifyContent="center"
            sx={
              accounts.length > 0
                ? {
                    "& .MuiButton-root .MuiTypography-root": { visibility: "hidden" },
                    "& .MuiButton-root:focus .MuiTypography-root": { visibility: "visible" },
                    "& .MuiButton-root:hover .MuiTypography-root": { visibility: "visible" },
                  }
                : {}
            }
          >
            {accounts.map((accountName, index) => (
              <Button
                size="large"
                component={Link}
                key={accountName}
                sx={{ borderRadius: 0.25, padding: 2, width: 156 }}
                to={`/u/${index}`}
                aria-label={`Switch to account ${accountName}`}
                autoFocus={index === 0} // Doesn't work
                id={`account-${index}`}
              >
                <Stack alignItems="center" gap={1}>
                  <AccountAvatar alt={accountName} size="xl" />
                  <Typography variant="h6" fontFamily={SerifFont}>
                    {accountName}
                  </Typography>
                </Stack>
              </Button>
            ))}
            <Button
              aria-label="Add account"
              size="large"
              sx={{ borderRadius: 0.25, padding: 2, width: 156 }}
              onClick={toggleAddAccount}
              autoFocus={accounts.length === 0}
            >
              <Stack alignItems="center" gap={1}>
                <Avatar
                  sx={{
                    height: SIZE_MAP.xl / 2,
                    margin: `${SIZE_MAP.xl / 4}px`,
                    width: SIZE_MAP.xl / 2,
                  }}
                >
                  <Add sx={{ fontSize: SIZE_MAP.xl / 3 }} />
                </Avatar>
                <Typography variant="h6" fontFamily={SerifFont} sx={{ marginX: -0.25 }}>
                  Add account
                </Typography>
              </Stack>
            </Button>
          </StaggeredList>
        )}
      </Stack>
      <AddAccountDialog open={addAccountOpen} toggleOpen={toggleAddAccount} />
      <CloudLoginDialog open={loginOpen} toggleOpen={toggleLoginOpen} />
    </>
  )
}
