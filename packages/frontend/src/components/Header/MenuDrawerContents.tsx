import {
  AccountBalanceRounded,
  CloudRounded,
  ExtensionRounded,
  HomeRounded,
  ReceiptLong,
  SdStorageRounded,
  ShowChartRounded,
  Workspaces,
} from "@mui/icons-material"
import { Button, Stack, useMediaQuery } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { $activeAccount } from "src/stores/account-store"
import { isProduction } from "src/utils/utils"

import { AppVerProps, PopoverToggleProps } from "../../stores/app-store"
import { TransactionIcon } from "../icons"
import { NavMenuItem } from "../NavMenuItem"
import { AccountPickerButton } from "./AccountPickerButton"
import { LogoText } from "./LogoText"

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

  // TODO2
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

  // const { value: openSettings, toggle: toggleSettingsOpen } = useBoolean(false)

  const activeAccount = useStore($activeAccount)
  if (!activeAccount) return null

  return (
    <>
      <Stack
        paddingX={2}
        paddingY={1}
        gap={1}
        sx={{ height: "100%", width: "100%" }}
        justifyContent="space-between"
      >
        <Stack gap={0.25}>
          <Button
            size="small"
            variant="text"
            color="secondary"
            to="/"
            component={Link}
            sx={{
              borderRadius: 0.5,
              justifyContent: "flex-start",
              paddingX: 2,
            }}
            // sx={{ marginX: -2, paddingX: 2 }}
          >
            <LogoText />
          </Button>
          {/* <Stack direction="row"> */}
          <AccountPickerButton onClose={toggleOpen} />
          {/* <Tooltip title="Create">
            <Button
              sx={{
                borderRadius: 0.5,
                gap: 0.5,
                justifyContent: "flex-start",
                marginY: 1.5,
                minWidth: "unset",
                paddingLeft: 2,
                paddingRight: 2,
                paddingY: 1,
                textTransform: "none",
                width: "fit-content",
              }}
              color="secondary"
            >
              <AddCircle />
            </Button>
          </Tooltip> */}
          {/* </Stack> */}
          <NavMenuItem
            value=""
            to={`/u/${accountIndex}`}
            label="Home"
            aria-label="Visit Home"
            onClick={toggleOpen}
            avatar={<HomeRounded fontSize="small" />}
          />
          {!isProduction && (
            <NavMenuItem
              value="trades"
              to={`/u/${accountIndex}/trades`}
              label="Trades"
              aria-label="Visit Trades"
              onClick={toggleOpen}
              avatar={<ShowChartRounded fontSize="small" />}
            />
          )}
          <NavMenuItem
            value="transactions"
            to={`/u/${accountIndex}/transactions`}
            label="Transactions"
            aria-label="Visit Transactions"
            onClick={toggleOpen}
            avatar={<TransactionIcon fontSize="small" />}
          />
          <NavMenuItem
            value="audit-logs"
            to={`/u/${accountIndex}/audit-logs`}
            label="Audit logs"
            aria-label="Visit Audit logs"
            onClick={toggleOpen}
            avatar={<ReceiptLong fontSize="small" />}
          />
          <NavMenuItem
            value="assets"
            to={`/u/${accountIndex}/assets`}
            label="Assets"
            aria-label="Visit Assets"
            onClick={toggleOpen}
            avatar={<Workspaces fontSize="small" />}
          />
          <NavMenuItem
            value="platforms"
            to={`/u/${accountIndex}/platforms`}
            label="Platforms"
            aria-label="Visit Platforms"
            onClick={toggleOpen}
            avatar={<AccountBalanceRounded fontSize="small" />}
          />
          <NavMenuItem
            value="extensions"
            to={`/u/${accountIndex}/extensions`}
            label="Extensions"
            aria-label="Visit Extensions"
            onClick={toggleOpen}
            avatar={<ExtensionRounded fontSize="small" />}
          />
          <NavMenuItem
            value="import-data"
            to={`/u/${accountIndex}/import-data`}
            label="Data"
            aria-label="Visit Data"
            onClick={toggleOpen}
            avatar={<SdStorageRounded fontSize="small" />}
          />
          <NavMenuItem
            value="server"
            to={`/u/${accountIndex}/server`}
            label="Server"
            aria-label="Visit Server"
            onClick={toggleOpen}
            avatar={<CloudRounded fontSize="small" />}
          />
        </Stack>
        <Stack>
          {/* <MenuItem
            sx={{
              "&:hover": {
                color: "text.primary",
              },
              borderRadius: 0.5,
              color: "text.secondary",
              display: isInstalled ? "none" : "inline-flex",
            }}
            onClick={promptInstall}
            aria-label="Install app"
          >
            <ListItemAvatar>
              <DownloadRounded fontSize="small" />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  Install app{" "}
                  <Chip
                    size="small"
                    color="secondary"
                    sx={{
                      backgroundColor: "var(--mui-palette-secondary-main)",
                      fontSize: "0.625rem",
                      height: 18,
                    }}
                    label="Coming soon"
                  />
                </Stack>
              }
            />
          </MenuItem> */}
          {/* <MenuItem
            onClick={() => {
              toggleOpen()
              toggleSettingsOpen()
            }}
            sx={{
              "&:hover": {
                color: "text.primary",
              },
              borderRadius: 0.5,
              color: "text.secondary",
            }}
            aria-label="Open Settings"
          >
            <ListItemAvatar>
              <Settings
                sx={{
                  "li:hover &": {
                    transform: "rotate(-30deg)",
                  },
                  transition: "transform 0.33s",
                }}
              />
            </ListItemAvatar>
            <ListItemText primary="Settings" />
          </MenuItem> */}
        </Stack>
      </Stack>
    </>
  )
}
