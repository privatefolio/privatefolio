import { Settings, StorageRounded, SwapHoriz } from "@mui/icons-material"
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded"
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded"
import HomeRoundedIcon from "@mui/icons-material/HomeRounded"
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore"
import WebAssetRoundedIcon from "@mui/icons-material/WebAssetRounded"
import { Button, Stack, Typography, useMediaQuery } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useBoolean } from "src/hooks/useBoolean"
import { $activeAccount } from "src/stores/account-store"

import { AppVerProps, PopoverToggleProps } from "../../stores/app-store"
import { AccountAvatar } from "../AccountAvatar"
import { NavMenuItem } from "../NavMenuItem"
import { AccountPicker } from "./AccountPicker"
import { Logo } from "./Logo"
import { SettingsDrawer } from "./SettingsDrawer"

type MenuContentsProps = AppVerProps & PopoverToggleProps

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export const MenuDrawerContents = ({ appVer, gitHash, open, toggleOpen }: MenuContentsProps) => {
  // const debugMode = useStore($debugMode)
  // const telemetry = useStore($telemetry)

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const isInstalled = useMediaQuery("(display-mode: standalone)")

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
  }, [])

  const promptInstall = () => {
    if (installPrompt) {
      installPrompt.prompt()
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt")
        } else {
          console.log("User dismissed the install prompt")
        }
        setInstallPrompt(null)
      })
    }
  }

  const location = useLocation()
  const { pathname } = location
  const accountIndex = pathname.split("/")[2]

  const { value: openSettings, toggle: toggleOpenSettings } = useBoolean(false)
  const { value: openAccountPicker, toggle: toggleOpenAccountPicker } = useBoolean(false)
  const activeAccount = useStore($activeAccount)

  return (
    <>
      <Stack
        paddingX={2}
        paddingY={1}
        gap={1}
        sx={{ height: "100%", overflowX: "hidden", width: "100%" }}
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
                marginLeft: 1.5,
                // marginLeft: -1,
                padding: 1,
                textTransform: "none",
              }}
            >
              <Logo />
            </Button>
          </Stack>
          <Stack marginBottom={4}>
            <Button
              onClick={toggleOpenAccountPicker}
              size="small"
              variant="outlined"
              color={"secondary"}
              sx={{
                justifyContent: "space-between",
                padding: "6px 16px",
              }}
            >
              <Stack direction="row">
                <AccountAvatar alt={activeAccount} size="small" sx={{ alignSelf: "center" }} />

                <Typography
                  variant="subtitle1"
                  letterSpacing="0.025rem"
                  paddingLeft="1rem"
                  alignSelf="center"
                >
                  {activeAccount}
                </Typography>
              </Stack>
              <UnfoldMoreIcon color="secondary" />
            </Button>
            <AccountPicker
              open={openAccountPicker}
              toggleOpen={toggleOpenAccountPicker}
              toggleOpenMenuDrawer={toggleOpen}
            />
          </Stack>
          <NavMenuItem
            value=""
            to={`/u/${accountIndex}/`}
            label="Home"
            onClick={toggleOpen}
            avatar={<HomeRoundedIcon />}
            sx={{ borderRadius: 0.5 }}
          />
          <NavMenuItem
            value="assets"
            to={`/u/${accountIndex}/assets`}
            label="Assets"
            onClick={toggleOpen}
            avatar={<WebAssetRoundedIcon />}
            sx={{ borderRadius: 0.5 }}
          />
          <NavMenuItem
            value="transactions"
            to={`/u/${accountIndex}/transactions`}
            label="Transactions"
            onClick={toggleOpen}
            avatar={<SwapHoriz />}
            sx={{ borderRadius: 0.5 }}
          />
          <NavMenuItem
            value="audit-logs"
            to={`/u/${accountIndex}/audit-logs`}
            label="Audit logs"
            onClick={toggleOpen}
            avatar={<StorageRounded />}
            sx={{ borderRadius: 0.5 }}
          />
          <NavMenuItem
            value="import-data"
            to={`/u/${accountIndex}/import-data`}
            label="Import data"
            onClick={toggleOpen}
            avatar={<AttachFileRoundedIcon />}
            sx={{ borderRadius: 0.5 }}
          />
        </Stack>
        <Stack>
          <Button
            sx={{
              "&:hover": {
                color: "text.primary",
              },
              borderRadius: 0.5,
              color: "text.secondary",
              direction: "row",
              display: isInstalled ? "none" : "inline-flex",
              justifyContent: "flex-start",
              transition: "transform 0.33s",
              width: "100%",
            }}
            onClick={promptInstall}
          >
            <Stack display="contents">
              <DownloadRoundedIcon />
              <Typography variant="subtitle1" letterSpacing="0.025rem" paddingLeft="0.3rem">
                Install app
              </Typography>
            </Stack>
          </Button>
          <Button
            onClick={() => {
              toggleOpen()
              toggleOpenSettings()
            }}
            sx={{
              "&:hover": {
                color: "text.primary",
              },
              borderRadius: 0.5,
              color: "text.secondary",
              direction: "row",
              justifyContent: "flex-start",
              marginRight: -1,
              transition: "transform 0.33s",
              width: "100%",
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
          <SettingsDrawer open={openSettings} toggleOpen={toggleOpenSettings} />
        </Stack>
      </Stack>
    </>
  )
}
