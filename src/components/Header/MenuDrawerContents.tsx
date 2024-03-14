import { Settings, StorageRounded, SwapHoriz } from "@mui/icons-material"
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded"
import HomeRoundedIcon from "@mui/icons-material/HomeRounded"
import WebAssetRoundedIcon from "@mui/icons-material/WebAssetRounded"
import { Button, Stack, Typography } from "@mui/material"
import React from "react"
import { Link, useLocation } from "react-router-dom"
import { useBoolean } from "src/hooks/useBoolean"

import { AppVerProps, PopoverToggleProps } from "../../stores/app-store"
import { NavMenuItem } from "../NavMenuItem"
import { Logo } from "./Logo"
import { SettingsMenuDrawer } from "./SettingsDrawerMobile"

type MenuContentsProps = AppVerProps & PopoverToggleProps

export const MenuDrawerContents = ({ appVer, gitHash, open, toggleOpen }: MenuContentsProps) => {
  // const debugMode = useStore($debugMode)
  // const telemetry = useStore($telemetry)

  const location = useLocation()
  const { pathname } = location
  const accountIndex = pathname.split("/")[2]

  const { value: openSettings, toggle: toggleOpenSettings } = useBoolean(false)

  return (
    <>
      <Stack
        paddingX={2}
        paddingY={1}
        gap={1}
        sx={{ height: "100%", overflowX: "hidden" }}
        justifyContent="space-between"
      >
        <Stack>
          <Stack direction="row" justifyContent="flex-between" paddingBottom={4}>
            <Button
              to="/"
              aria-label="Visit Homepage"
              component={Link}
              sx={{
                borderRadius: 8,
                marginLeft: -1,
                padding: 1,
                textTransform: "none",
              }}
            >
              <Logo />
            </Button>
          </Stack>
          <NavMenuItem
            value=""
            to={`/u/${accountIndex}/`}
            label="Home"
            onClick={toggleOpen}
            avatar={<HomeRoundedIcon />}
          />
          <NavMenuItem
            value="assets"
            to={`/u/${accountIndex}/assets`}
            label="Assets"
            onClick={toggleOpen}
            avatar={<WebAssetRoundedIcon />}
          />
          <NavMenuItem
            value="transactions"
            to={`/u/${accountIndex}/transactions`}
            label="Transactions"
            onClick={toggleOpen}
            avatar={<SwapHoriz />}
          />
          <NavMenuItem
            value="audit-logs"
            to={`/u/${accountIndex}/audit-logs`}
            label="Audit logs"
            onClick={toggleOpen}
            avatar={<StorageRounded />}
          />
          <NavMenuItem
            value="import-data"
            to={`/u/${accountIndex}/import-data`}
            label="Import data"
            onClick={toggleOpen}
            avatar={<AttachFileRoundedIcon />}
          />
        </Stack>
        <Stack>
          {/* <Button
            color="secondary"
            sx={{
              direction: "row",
              justifyContent: "flex-start",
              transition: "transform 0.33s",
            }}
          >
            <Stack display="contents">
              <DownloadRoundedIcon />
              <Typography variant="subtitle1" letterSpacing="0.025rem" paddingLeft="0.3rem">
                Download the app
              </Typography>
            </Stack>
          </Button> */}
          <Button
            color="secondary"
            onClick={() => {
              toggleOpen()
              toggleOpenSettings()
            }}
            sx={{
              direction: "row",
              justifyContent: "flex-start",
              marginRight: -1,
              transition: "transform 0.33s",
            }}
          >
            <Stack display="contents">
              <Settings
                fontSize="small"
                sx={{
                  "&:hover": {
                    transform: "rotate(-30deg)",
                  },
                  transition: "transform 0.33s",
                }}
              />
              <Typography variant="subtitle1" letterSpacing="0.025rem" paddingLeft="0.5rem">
                Settings
              </Typography>
            </Stack>
          </Button>
        </Stack>
        <SettingsMenuDrawer open={openSettings} toggleOpen={toggleOpenSettings} />
      </Stack>
    </>
  )
}
