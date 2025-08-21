import { AppBar, Button, Container, Fade, Stack, Toolbar } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { $activeAccount, $activeAccountType } from "src/stores/account-store"
import { isLinux, isMac, isWindows } from "src/utils/electron-utils"

import { AppLink } from "../AppLink"
import { CloudServerButton } from "../CloudServerButton"
import { CurrencySelector } from "../CurrencySelector"
import { LocalServerButton } from "../LocalServerButton"
import { Logo } from "../Logo"
import { NotificationDropdown } from "../Notifications/NotificationDropdown"
import { SearchBar } from "../SearchBar/SearchBar"
import { TaskDropdown } from "../Tasks/TaskDropdown"
import { LogoText } from "./LogoText"
import { NavigationMenu } from "./NavigationMenu"
import { SettingsButton } from "./SettingsButton"

export function Header() {
  const activeAccount = useStore($activeAccount)
  const [showAppBar, setShowAppBar] = useState(false)
  const activeAccountType = useStore($activeAccountType)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowAppBar(true)
    }, 250)
    return () => clearTimeout(timeout)
  }, [])

  if (activeAccount === "")
    return (
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backdropFilter: "none !important",
          backgroundColor: "var(--mui-palette-background-default)",
          border: "none",
        }}
      >
        <Fade in={showAppBar} timeout={400}>
          <Toolbar disableGutters>
            <Container
              disableGutters
              maxWidth="md"
              sx={{ paddingX: 2, paddingY: 0, position: "relative" }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
                sx={(theme) => ({
                  [theme.breakpoints.down("xxl")]: {
                    marginLeft: isMac ? 10 : 0,
                    marginRight: isWindows ? 15 : isLinux ? 9 : 0,
                  },
                })}
              >
                <Button
                  size="small"
                  color="secondary"
                  variant="text"
                  href="/"
                  // href="https://privatefolio.xyz"
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
                <Stack direction="row" alignItems="center">
                  <CloudServerButton />
                  <LocalServerButton />
                  <SettingsButton />
                </Stack>
              </Stack>
            </Container>
          </Toolbar>
        </Fade>
      </AppBar>
    )

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backdropFilter: "none !important",
        backgroundColor: "var(--mui-palette-background-default)",
        border: "none",
      }}
    >
      <Toolbar disableGutters>
        <Container
          disableGutters
          maxWidth="xl"
          sx={{ paddingX: 2, paddingY: 0, position: "relative" }}
        >
          <Stack
            direction="row"
            gap={1}
            justifyContent="space-between"
            sx={(theme) => ({
              [theme.breakpoints.down("md")]: {
                marginLeft: isMac ? 8 : 0,
              },
              [theme.breakpoints.down("xxl")]: {
                marginRight: isWindows ? 15 : isLinux ? 9 : 0,
              },
            })}
          >
            <Stack direction="row" alignItems="center" sx={{ flex: 1 }} gap={1}>
              <NavigationMenu />
              <SearchBar />
            </Stack>
            <Stack direction="row" gap={1} alignItems="center" justifyContent="flex-end">
              <TaskDropdown />
              <CurrencySelector />
              <Stack direction="row" alignItems="center">
                <NotificationDropdown />
                {activeAccountType === "cloud" && <CloudServerButton />}
                {activeAccountType === "local" && <LocalServerButton />}
                <SettingsButton />
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  )
}
