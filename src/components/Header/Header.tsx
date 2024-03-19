"use client"

import { AppBar, Container, Grid, Stack, Toolbar } from "@mui/material"
import React from "react"

import { TaskDropdown } from "../Tasks/TaskDropdown"
import { NavigationMenu } from "./NavigationMenu"

export function Header() {
  return (
    <AppBar position="static" elevation={0} sx={{ background: "none !important", border: "none" }}>
      <Toolbar disableGutters>
        <Container
          disableGutters
          maxWidth="xl"
          sx={{ paddingX: { xs: 2 }, paddingY: 0, position: "relative" }}
        >
          <Grid
            container
            spacing={{ sm: 2, xs: 0 }}
            paddingX={2}
            marginY={1}
            justifyContent="space-between"
          >
            <Grid item xs={9} md={6} component={Stack} alignItems="center">
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
              {/* <CurrencySelector /> */}
            </Grid>
          </Grid>
        </Container>
      </Toolbar>
    </AppBar>
  )
}
