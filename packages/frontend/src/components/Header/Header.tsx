"use client"

import { AppBar, Container, Stack, Toolbar, useTheme } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect } from "react"
import { $activeAccount } from "src/stores/account-store"
import { setElectronMode, stickyHeader } from "src/utils/electron-utils"

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
      position={stickyHeader ? "sticky" : "static"}
      elevation={0}
      sx={{
        "& button": {
          WebkitAppRegion: "no-drag",
        },
        WebkitAppRegion: "drag",
        background: "none !important",
        border: "none",
      }}
    >
      <Toolbar disableGutters>
        <Container
          disableGutters
          maxWidth="xl"
          sx={{ paddingX: 2, paddingY: 0, position: "relative" }}
        >
          <Stack direction="row" gap={1} justifyContent="space-between">
            <Stack direction="row" alignItems="center" sx={{ flex: 1 }} gap={1}>
              <NavigationMenu />
              <SearchBar />
            </Stack>
            <Stack
              direction="row"
              gap={1}
              alignItems="center"
              justifyContent="flex-end"
              sx={{ marginRight: stickyHeader ? "120px" : 0 }}
            >
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
