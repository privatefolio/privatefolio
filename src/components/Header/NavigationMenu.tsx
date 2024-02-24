import { MenuRounded } from "@mui/icons-material"
import { Box, IconButton, InputBase, Select, tabsClasses, Tooltip } from "@mui/material"
import React from "react"
import { useLocation } from "react-router-dom"
import { useBoolean } from "src/hooks/useBoolean"

import { NavMenuItem } from "../NavMenuItem"
import { NavTab } from "../NavTab"
import { Tabs } from "../Tabs"

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
        <Select
          open={open}
          onClose={toggleOpen}
          onOpen={toggleOpen}
          value={overriddenPathname || ""}
          IconComponent={() => false}
          input={
            <InputBase sx={{ height: 36, position: "absolute", visibility: "hidden", width: 30 }} />
          }
        >
          <NavMenuItem value="" to={`/u/${accountIndex}/`} label="Home" />
          <NavMenuItem value="assets" to={`/u/${accountIndex}/assets`} label="Assets" />
          <NavMenuItem
            value="transactions"
            to={`/u/${accountIndex}/transactions`}
            label="Transactions"
          />
          <NavMenuItem value="audit-logs" to={`/u/${accountIndex}/audit-logs`} label="Audit logs" />
          <NavMenuItem
            value="import-data"
            to={`/u/${accountIndex}/import-data`}
            label="Import data"
          />
        </Select>
        <Tooltip title="Navigation menu">
          <IconButton edge="start" onClick={toggleOpen} color="secondary">
            <MenuRounded fontSize="small" />
          </IconButton>
        </Tooltip>
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
