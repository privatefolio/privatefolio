import { Add, Cloud, Settings } from "@mui/icons-material"
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Fade,
  IconButton,
  Link as MuiLink,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AccountAvatar, SIZE_MAP } from "src/components/AccountAvatar"
import { AddAccountDialog } from "src/components/AccountPicker/AddAccountDialog"
import { CloudLoginDialog } from "src/components/AccountPicker/CloudLoginDialog"
import { CircularSpinner } from "src/components/CircularSpinner"
import { Gravatar } from "src/components/Gravatar"
import { LogoText } from "src/components/Header/LogoText"
import { SettingsDrawer } from "src/components/Header/SettingsDrawer"
import { StaggeredList } from "src/components/StaggeredList"
import { Truncate } from "src/components/Truncate"
import { useBoolean } from "src/hooks/useBoolean"
import { $accounts, $activeAccount, $activeIndex } from "src/stores/account-store"
import { $cloudRpcReady, $cloudUser } from "src/stores/cloud-user-store"
import { SerifFont } from "src/theme"
import { cloudEnabled, localServerEnabled, SPRING_CONFIGS } from "src/utils/utils"

export default function AccountsPage() {
  useEffect(() => {
    document.title = `Accounts - Privatefolio`
  }, [])

  const accounts = useStore($accounts)
  const activeIndex = useStore($activeIndex)

  const { value: addAccountOpen, toggle: toggleAddAccount } = useBoolean(false)
  const { value: loginOpen, toggle: toggleLoginOpen } = useBoolean(false)

  const cloudUser = useStore($cloudUser)
  const cloudRpcReady = useStore($cloudRpcReady)

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

  const { value: openSettings, toggle: toggleSettingsOpen } = useBoolean(false)

  const isDesktop = useMediaQuery("(min-width: 900px)")

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
                gap={1}
                sx={{
                  height: "100%",

                  width: "100%",
                }}
              >
                <Button
                  size="small"
                  variant="text"
                  href="https://privatefolio.xyz"
                  target="_blank"
                  sx={{ marginX: -2, paddingX: 2 }}
                >
                  <LogoText />
                </Button>
                <Stack direction="row" gap={1} alignItems="center">
                  {cloudUser !== undefined && !cloudUser && cloudEnabled && (
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
                  {cloudUser !== undefined && cloudUser && cloudEnabled && (
                    <Tooltip title="View PrivateCloud account">
                      <Button
                        color="secondary"
                        size="small"
                        endIcon={
                          cloudUser.email ? (
                            <Gravatar email={cloudUser.email} sx={{ height: 18, width: 18 }} />
                          ) : (
                            <Cloud />
                          )
                        }
                        variant="outlined"
                        component={Link}
                        to="/cloud"
                      >
                        <Truncate sx={{ maxWidth: { sm: "unset", xs: "15vw" } }}>
                          {cloudUser.email}
                        </Truncate>
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip title="Device Settings">
                    <IconButton
                      onClick={toggleSettingsOpen}
                      color="secondary"
                      aria-label="Open Settings"
                      size="small"
                    >
                      <Settings
                        sx={{
                          "button:hover &": {
                            transform: "rotate(-30deg)",
                          },
                          transition: "transform 0.33s",
                        }}
                        fontSize="small"
                      />
                    </IconButton>
                  </Tooltip>
                  <SettingsDrawer open={openSettings} toggleOpen={toggleSettingsOpen} />
                </Stack>
              </Stack>
            </Container>
          </Toolbar>
        </Fade>
      </AppBar>
      <Stack
        sx={{
          background: "var(--mui-palette-background-default)",
          height: { sm: "calc(100vh - 64px - 24px)", xs: "calc(100vh - 56px - 24px)" },
          left: 0,
          marginBottom: 3,
          marginTop: { sm: 8, xs: 7 },
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 1000,
        }}
        alignItems="center"
        justifyContent="center"
      >
        {!localServerEnabled && cloudUser === null ? (
          <Fade in timeout={400}>
            <Typography variant="caption" textAlign="center">
              Login to PrivateCloud to get started.
              <br />
              <br />
              Download the desktop app for Windows, Mac, and Linux <br /> to use the app locally,
              without the cloud.
            </Typography>
          </Fade>
        ) : !localServerEnabled && cloudUser && cloudRpcReady === false ? (
          <MuiLink component={Link} to="/privatecloud" variant="caption" textAlign="center">
            Please configure your PrivateCloud instance
          </MuiLink>
        ) : !accounts ? (
          <Stack alignItems="center" justifyContent="center" gap={1}>
            <CircularSpinner />
          </Stack>
        ) : (
          <Box
            sx={{
              maxWidth: "calc(100% - 32px)",
              overflowX: { sm: "auto", xs: "hidden" },
              overflowY: { sm: "hidden", xs: "auto" },
              paddingX: { sm: 0, xs: 1 },
              paddingY: { sm: 1, xs: 0 },
            }}
          >
            <StaggeredList
              gap={2}
              secondary
              config={SPRING_CONFIGS.quick}
              delay={0}
              alignItems="flex-start"
              justifyContent="center"
              sx={{
                flexDirection: { sm: "row", xs: "column" },
                minWidth: "fit-content",
                ...(accounts.length > 0 &&
                  accounts.length < 6 &&
                  isDesktop && {
                    "& .MuiButton-root .MuiTypography-root": { visibility: "hidden" },
                    "& .MuiButton-root:focus .MuiTypography-root": { visibility: "visible" },
                    "& .MuiButton-root:hover .MuiTypography-root": { visibility: "visible" },
                  }),
              }}
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
          </Box>
        )}
      </Stack>
      <AddAccountDialog open={addAccountOpen} toggleOpen={toggleAddAccount} />
      <CloudLoginDialog open={loginOpen} toggleOpen={toggleLoginOpen} />
    </>
  )
}
