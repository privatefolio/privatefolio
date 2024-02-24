"use client"

import { AppBar, Button, Container, Grid, Stack, Toolbar } from "@mui/material"
import React from "react"
import { Link } from "react-router-dom"

import { TaskDropdown } from "../Tasks/TaskDropdown"
import { AccountPicker } from "./AccountPicker"
import { Logo } from "./Logo"
import { NavigationMenu } from "./NavigationMenu"
import { SettingsDrawer } from "./SettingsDrawer"

export function Header() {
  return (
    <AppBar position="static" elevation={0} sx={{ background: "none !important", border: "none" }}>
      <Toolbar disableGutters>
        <Container
          disableGutters
          maxWidth="xl"
          sx={{ paddingX: { xs: 2 }, paddingY: 0, position: "relative" }}
        >
          <Grid container spacing={{ sm: 2, xs: 0 }} paddingX={2} marginY={1}>
            <Grid item md={3} sx={{ display: { md: "block", xs: "none" } }}>
              <Stack direction="row" gap={1} alignItems="center" sx={{ height: "100%" }}>
                <Button
                  to="/"
                  aria-label="Visit Homepage"
                  component={Link}
                  sx={{
                    borderRadius: 8,
                    marginLeft: -1,
                    padding: 1,
                    textTransform: "none",
                  }}
                >
                  <Logo />
                </Button>
              </Stack>
            </Grid>
            <Grid
              item
              xs={9}
              md={6}
              component={Stack}
              alignItems="center"
              justifyContent={{ md: "center" }}
            >
              <NavigationMenu />
            </Grid>
            <Grid
              item
              xs={3}
              md={3}
              gap={0.5}
              alignItems="center"
              component={Stack}
              justifyContent="flex-end"
            >
              <TaskDropdown />
              <SettingsDrawer />
              <AccountPicker />
            </Grid>
          </Grid>
        </Container>
      </Toolbar>
    </AppBar>
  )
}
