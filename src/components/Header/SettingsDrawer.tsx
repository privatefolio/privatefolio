import { CloseRounded } from "@mui/icons-material"
import {
  Drawer,
  IconButton,
  Stack,
  styled,
  SwipeableDrawer,
  Typography,
  useMediaQuery,
} from "@mui/material"
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
            sx={{ paddingTop: "1rem" }}
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
      <Drawer
        keepMounted
        open={open}
        // transitionDuration={500}
        // TODO this should have a delay
        onClose={toggleOpen}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          paddingX={2}
          paddingY={1}
        >
          <Typography variant="subtitle1" letterSpacing="0.025rem">
            Settings
          </Typography>
          <IconButton onClick={toggleOpen} edge="end" color="secondary">
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>

        <SettingsDrawerContents appVer={APP_VERSION} gitHash={GIT_HASH} />
      </Drawer>
    </>
  )
}
