import { CloseRounded, Settings as SettingsIcon } from "@mui/icons-material"
import { Drawer, IconButton, Stack, Tooltip, Typography } from "@mui/material"
import React from "react"
import { APP_VERSION, GIT_HASH } from "src/env"

import { useBoolean } from "../../hooks/useBoolean"
import { SettingsDrawerContents } from "./SettingsDrawerContents"

export function SettingsDrawer() {
  const { value: open, toggle: toggleOpen } = useBoolean(false)

  return (
    <>
      <Tooltip title="Settings">
        <IconButton
          color="secondary"
          onClick={toggleOpen}
          sx={{
            "&:hover": {
              transform: "rotate(-30deg)",
            },
            marginRight: -1,
            transition: "transform 0.33s",
          }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>
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
