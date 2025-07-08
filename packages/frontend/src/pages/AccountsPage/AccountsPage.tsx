import { Add, Cloud, OpenInNewRounded } from "@mui/icons-material"
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Fade,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AccountAvatar, SIZE_MAP } from "src/components/AccountAvatar"
import { AddAccountDialog } from "src/components/AccountPicker/AddAccountDialog"
import { AppLink } from "src/components/AppLink"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { Gravatar } from "src/components/Gravatar"
import { LogoText } from "src/components/Header/LogoText"
import { SettingsButton } from "src/components/Header/SettingsButton"
import { Logo } from "src/components/Logo"
import { StaggeredList } from "src/components/StaggeredList"
import { Truncate } from "src/components/Truncate"
import { useBoolean } from "src/hooks/useBoolean"
import { useBreakpoints } from "src/hooks/useBreakpoints"
import { $activeAccount, $cloudAccounts, $localAccounts } from "src/stores/account-store"
import { $cloudRpcReady, $cloudUser } from "src/stores/cloud-user-store"
import { SerifFont } from "src/theme"
import { isElectron, isWindows } from "src/utils/electron-utils"
import { cloudEnabled, localServerEnabled, SPRING_CONFIGS } from "src/utils/utils"

export default function AccountsPage() {
  useEffect(() => {
    document.title = `Accounts - Privatefolio`
  }, [])

  const localAccounts = useStore($localAccounts)
  const cloudAccounts = useStore($cloudAccounts)
  const activeAccount = useStore($activeAccount)

  const { value: addAccountOpen, toggle: toggleAddAccount } = useBoolean(false)

  const cloudUser = useStore($cloudUser)
  const cloudRpcReady = useStore($cloudRpcReady)

  useEffect(() => {
    if (activeAccount) {
      $activeAccount.set("")
    }
  }, [activeAccount])

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

  const { isDesktop } = useBreakpoints()

  const showWelcomeMessage = !localServerEnabled && cloudUser === null
  const showConfigureMessage = !localServerEnabled && cloudUser && cloudRpcReady === false

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

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          "& button, & .MuiInputBase-root, & a": {
            WebkitAppRegion: "no-drag",
          },
          WebkitAppRegion: "drag",
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
                sx={(theme) => ({
                  [theme.breakpoints.down("xxl")]: {
                    marginRight: !isElectron ? 0 : isWindows ? 15 : 9,
                  },
                })}
              >
                <Button
                  size="small"
                  color="secondary"
                  variant="text"
                  href="https://privatefolio.xyz"
                  component={AppLink}
                  sx={{ marginX: -2, paddingX: 2 }}
                >
                  <LogoText
                    sx={{
                      display: {
                        sm: "inline-flex",
                        xs: "none",
                      },
                    }}
                  />
                  <Logo
                    width={24}
                    height={24}
                    sx={{
                      display: {
                        sm: "none",
                        xs: "inline-flex",
                      },
                    }}
                  />
                </Button>
                <Stack direction="row" gap={1} alignItems="center">
                  {cloudUser !== undefined && !cloudUser && cloudEnabled && (
                    <Button
                      color="secondary"
                      size="small"
                      endIcon={<Cloud />}
                      variant="outlined"
                      component={Link}
                      to="/cloud"
                      sx={{
                        display: showWelcomeMessage ? "none" : "inline-flex",
                      }}
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
                  <SettingsButton size="small" />
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
          // zIndex: 1000,
        }}
        alignItems="center"
        justifyContent="center"
      >
        {showWelcomeMessage ? (
          <Fade in timeout={400}>
            <Stack gap={2} alignItems="center">
              <Typography variant="h5" textAlign="center" fontWeight={700}>
                Welcome to Privatefolio!
              </Typography>
              <Button
                size="large"
                variant="contained"
                component={Link}
                to="/cloud"
                endIcon={<Cloud />}
                sx={{
                  paddingY: 0.25,
                }}
              >
                Login to PrivateCloud
              </Button>{" "}
              <Button
                size="large"
                variant="contained"
                href="https://privatefolio.xyz/downloads"
                component={AppLink}
                endIcon={<OpenInNewRounded sx={{ fontSize: "1rem !important" }} />}
                sx={{
                  paddingY: 0.25,
                }}
              >
                Download the Desktop app
              </Button>{" "}
            </Stack>
          </Fade>
        ) : showConfigureMessage ? (
          <Stack gap={2} alignItems="center">
            <Typography variant="h5" textAlign="center" fontWeight={700}>
              Your cloud instance is not yet set up.
            </Typography>
            <Button
              size="large"
              variant="contained"
              component={Link}
              to="/cloud"
              endIcon={<Cloud />}
              sx={{
                paddingY: 0.25,
              }}
            >
              Configure your cloud instance
            </Button>
          </Stack>
        ) : !localAccounts && !cloudAccounts ? (
          <Stack alignItems="center" justifyContent="center" gap={1}>
            <DefaultSpinner />
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
                ...(allAccounts.length > 0 &&
                  allAccounts.length < 6 &&
                  isDesktop && {
                    "& .MuiButton-root .MuiTypography-root": { visibility: "hidden" },
                    "& .MuiButton-root:focus .MuiTypography-root": { visibility: "visible" },
                    "& .MuiButton-root:hover .MuiTypography-root": { visibility: "visible" },
                  }),
              }}
            >
              {allAccounts.map((x, index) => (
                <Button
                  size="large"
                  component={Link}
                  key={`${x.type}-${x.accountName}`}
                  sx={{ borderRadius: 0.25, padding: 2, width: 156 }}
                  to={`/${x.type === "local" ? "l" : "c"}/${x.accountIndex}`}
                  aria-label={`Switch to account ${x.accountName}`}
                  // autoFocus={index === 0} // Doesn't work
                  id={`account-${index}`}
                >
                  <Stack alignItems="center" gap={1}>
                    <AccountAvatar alt={x.accountName} size="xl" type={x.type} />
                    <Typography variant="h6" fontFamily={SerifFont}>
                      {x.accountName}
                    </Typography>
                  </Stack>
                </Button>
              ))}
              <Button
                aria-label="Add account"
                size="large"
                sx={{ borderRadius: 0.25, padding: 2, width: 156 }}
                onClick={toggleAddAccount}
                autoFocus={allAccounts.length === 0}
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
    </>
  )
}
