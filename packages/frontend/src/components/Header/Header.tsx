"use client"

import { AppBar, Container, Stack, Toolbar, useTheme } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect } from "react"
import { $activeAccount } from "src/stores/account-store"
import { isElectron, setElectronMode } from "src/utils/electron-utils"

import { CurrencySelector } from "../CurrencySelector"
import { SearchBar } from "../SearchBar/SearchBar"
import { TaskDropdown } from "../Tasks/TaskDropdown"
import { NavigationMenu } from "./NavigationMenu"
import { SettingsButton } from "./SettingsButton"

export function Header() {
  const theme = useTheme()
  useEffect(() => {
    setElectronMode?.(theme.palette.mode)
  }, [theme.palette.mode])

  const activeAccount = useStore($activeAccount)
  if (activeAccount === "") return null

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        "& button, & .MuiInputBase-root": {
          WebkitAppRegion: "no-drag",
        },
        WebkitAppRegion: "drag",
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
            sx={{ marginRight: isElectron ? 9 : 0 }}
          >
            <Stack direction="row" alignItems="center" sx={{ flex: 1 }} gap={1}>
              <NavigationMenu />
              <SearchBar />
            </Stack>
            <Stack direction="row" gap={1} alignItems="center" justifyContent="flex-end">
              <TaskDropdown />
              <CurrencySelector />
              <SettingsButton />
            </Stack>
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  )
}
