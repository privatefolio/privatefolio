"use client"

import { AppBar, Container, Stack, Toolbar } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { $activeAccount } from "src/stores/account-store"
import { isLinux, isMac, isWindows } from "src/utils/electron-utils"

import { CurrencySelector } from "../CurrencySelector"
import { SearchBar } from "../SearchBar/SearchBar"
import { TaskDropdown } from "../Tasks/TaskDropdown"
import { NavigationMenu } from "./NavigationMenu"
import { SettingsButton } from "./SettingsButton"

export function Header() {
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
              <SettingsButton />
            </Stack>
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  )
}
