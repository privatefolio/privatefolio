import { MenuRounded } from "@mui/icons-material"
import { IconButton, SwipeableDrawer, Tooltip, useMediaQuery } from "@mui/material"
import React from "react"
import { APP_VERSION, GIT_HASH } from "src/env"
import { useBoolean } from "src/hooks/useBoolean"

import { MenuDrawerContents } from "./MenuDrawerContents"

export function NavigationMenu() {
  const { value: open, toggle: toggleOpen } = useBoolean(false)

  const isDesktop = useMediaQuery("(min-width: 1836px)")

  if (isDesktop) return

  return (
    <>
      <Tooltip title="Navigation menu">
        <IconButton onClick={toggleOpen} color="secondary" sx={{ marginLeft: 0.5 }}>
          <MenuRounded fontSize="medium" />
        </IconButton>
      </Tooltip>
      <SwipeableDrawer
        keepMounted
        open={open}
        anchor="left"
        elevation={0}
        // transitionDuration={500}
        // TODO this should have a delay
        onOpen={toggleOpen}
        onClose={toggleOpen}
        disableSwipeToOpen
        sx={{
          "& .MuiPaper-root": {
            width: 300,
            // width: "min(calc(100% - 80px), 400px)",
          },
        }}
      >
        <MenuDrawerContents
          open={open}
          toggleOpen={toggleOpen}
          appVer={APP_VERSION}
          gitHash={GIT_HASH}
        />
      </SwipeableDrawer>
    </>
  )
}
