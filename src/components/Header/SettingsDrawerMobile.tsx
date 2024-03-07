import { styled, SwipeableDrawer, Typography } from "@mui/material"
import { grey } from "@mui/material/colors"
import React from "react"
import { APP_VERSION, GIT_HASH } from "src/env"
import { PopoverToggleProps } from "src/stores/app-store"

import { SettingsDrawerContents } from "./SettingsDrawerContents"

const Puller = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.mode === "light" ? grey[300] : grey[900],
  borderRadius: 3,
  height: 6,
  left: "calc(50% - 15px)",
  position: "absolute",
  top: 8,
  width: 30,
}))

export function SettingsMenuDrawer(props: PopoverToggleProps) {
  const { open, toggleOpen } = props

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
          sx={{ paddingTop: "1rem" }}
        >
          Settings
        </Typography>
        <SettingsDrawerContents appVer={APP_VERSION} gitHash={GIT_HASH} />
      </SwipeableDrawer>
    </>
  )
}
