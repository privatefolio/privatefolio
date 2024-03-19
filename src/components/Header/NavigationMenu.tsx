import { MenuRounded } from "@mui/icons-material"
import { Box, IconButton, SwipeableDrawer, Tooltip } from "@mui/material"
import React from "react"
import { APP_VERSION, GIT_HASH } from "src/env"
import { useBoolean } from "src/hooks/useBoolean"

import { MenuDrawerContents } from "./MenuDrawerContents"

export function NavigationMenu() {
  const { value: open, toggle: toggleOpen } = useBoolean(false)

  return (
    <>
      <Box sx={{ display: { xl: "none" } }}>
        <Tooltip title="Navigation menu">
          <IconButton edge="start" onClick={toggleOpen} color="secondary">
            <MenuRounded fontSize="small" />
          </IconButton>
        </Tooltip>
        <SwipeableDrawer
          keepMounted
          open={open}
          anchor="left"
          // transitionDuration={500}
          // TODO this should have a delay
          onOpen={toggleOpen}
          onClose={toggleOpen}
          disableSwipeToOpen
          sx={{
            "& .MuiPaper-root": {
              width: { lg: "20%", md: "30%", sm: "40%", xs: "calc(100% - 80px)" },
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
      </Box>
    </>
  )
}
