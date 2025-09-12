import { Box, Drawer, SwipeableDrawer, Typography } from "@mui/material"
import React from "react"
import { APP_VERSION, GIT_HASH } from "src/env"
import { useBreakpoints } from "src/hooks/useBreakpoints"
import { PopoverToggleProps } from "src/stores/app-store"

import { DrawerHeader } from "../DrawerHeader"
import { Puller } from "../Puller"
import { SettingsDrawerContents } from "./SettingsDrawerContents"

export function SettingsDrawer(props: PopoverToggleProps) {
  const { open, toggleOpen } = props

  const { isMobile } = useBreakpoints()

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
            sx={{ marginBottom: 1, marginTop: 2 }}
          >
            Settings
          </Typography>
          <Box sx={{ overflowY: "auto" }}>
            <SettingsDrawerContents appVer={APP_VERSION} gitHash={GIT_HASH} />
          </Box>
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
