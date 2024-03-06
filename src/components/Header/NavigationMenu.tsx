import { MenuRounded } from "@mui/icons-material"
import { Box, Drawer, IconButton, tabsClasses, Tooltip } from "@mui/material"
import React from "react"
import { useLocation } from "react-router-dom"
import { APP_VERSION, GIT_HASH } from "src/env"
import { useBoolean } from "src/hooks/useBoolean"

import { NavTab } from "../NavTab"
import { Tabs } from "../Tabs"
import { MenuDrawerContents } from "./MenuDrawerContents"

export function NavigationMenu() {
  const location = useLocation()
  const { pathname } = location
  const accountIndex = pathname.split("/")[2]
  const appPath = pathname.split("/").slice(3).join("/")

  const overriddenPathname = appPath.includes("asset/") ? "" : appPath

  const { value: open, toggle: toggleOpen } = useBoolean(false)

  return (
    <>
      <Box sx={{ display: { sm: "none" } }}>
        <Tooltip title="Navigation menu">
          <IconButton edge="start" onClick={toggleOpen} color="secondary">
            <MenuRounded fontSize="small" />
          </IconButton>
        </Tooltip>
        <Drawer
          keepMounted
          open={open}
          anchor="left"
          // transitionDuration={500}
          // TODO this should have a delay
          onClose={toggleOpen}
          sx={{
            "& .MuiPaper-root": {
              width: "calc(100% - 80px)",
            },
          }}
        >
          <MenuDrawerContents
            open={open}
            toggleOpen={toggleOpen}
            appVer={APP_VERSION}
            gitHash={GIT_HASH}
          />
        </Drawer>
      </Box>
      <Tabs
        value={overriddenPathname}
        sx={(theme) => ({
          display: { sm: "block", xs: "none" },
          height: 48,
          marginX: 0, // TODO why is this needed?
          [`& .${tabsClasses.indicator}`]: {
            background: "var(--mui-palette-secondary-main)",
            //
            borderRadius: 2,
            bottom: 8,
            height: 4,
          },
          [`& .${tabsClasses.flexContainer} > a`]: {
            minWidth: 0,
            paddingX: 0,
            transition: theme.transitions.create("color"),
          },
        })}
      >
        <NavTab value="" to={`/u/${accountIndex}/`} label="Home" />
        <NavTab value="assets" to={`/u/${accountIndex}/assets`} label="Assets" />
        <NavTab value="transactions" to={`/u/${accountIndex}/transactions`} label="Transactions" />
        <NavTab value="audit-logs" to={`/u/${accountIndex}/audit-logs`} label="Audit logs" />
        <NavTab value="import-data" to={`/u/${accountIndex}/import-data`} label="Import data" />
      </Tabs>
    </>
  )
}
