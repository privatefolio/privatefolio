import { Drawer, SwipeableDrawer, Typography, useMediaQuery } from "@mui/material"
import React from "react"
import { APP_VERSION, GIT_HASH } from "src/env"
import { PopoverToggleProps } from "src/stores/app-store"

import { DrawerHeader } from "../DrawerHeader"
import { Puller } from "../Puller"
import { SettingsDrawerContents } from "./SettingsDrawerContents"

export function SettingsDrawer(props: PopoverToggleProps) {
  const { open, toggleOpen } = props

  const isMobile = useMediaQuery("(max-width: 599px)")

  if (isMobile) {
    return (
      <>
        <SwipeableDrawer
          anchor="bottom"
          open={open}
          onClose={toggleOpen}
          onOpen={toggleOpen}
          disableSwipeToOpen
          sx={{
            "& .MuiPaper-root": {
              borderTopLeftRadius: "25px",
              borderTopRightRadius: "25px",
            },
          }}
        >
          <Puller />
          <Typography
            variant="subtitle1"
            letterSpacing="0.025rem"
            align="center"
            sx={{ marginTop: 2 }}
          >
            Settings
          </Typography>
          <SettingsDrawerContents appVer={APP_VERSION} gitHash={GIT_HASH} />
        </SwipeableDrawer>
      </>
    )
  }
  return (
    <>
      <Drawer keepMounted open={open} onClose={toggleOpen}>
        <DrawerHeader toggleOpen={toggleOpen} paddingX={2} paddingY={1}>
          Settings
        </DrawerHeader>
        <SettingsDrawerContents appVer={APP_VERSION} gitHash={GIT_HASH} />
      </Drawer>
    </>
  )
}
