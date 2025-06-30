import {
  AccountBalanceRounded,
  AutoAwesomeRounded,
  CandlestickChartRounded,
  CloudRounded,
  ExtensionRounded,
  HomeRounded,
  ReceiptLong,
  SdStorageRounded,
  TimelineRounded,
  Workspaces,
} from "@mui/icons-material"
import { MenuItem, Stack, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { Link } from "react-router-dom"
import { $activeAccount, $activeAccountPath } from "src/stores/account-store"

import { AppVerProps, PopoverToggleProps } from "../../stores/app-store"
import { TransactionIcon } from "../icons"
import { Logo } from "../Logo"
import { NavMenuItem } from "../NavMenuItem"
import { AccountPickerButton } from "./AccountPickerButton"
import { LogoText } from "./LogoText"

type MenuContentsProps = AppVerProps & PopoverToggleProps

// interface BeforeInstallPromptEvent extends Event {
//   prompt: () => Promise<void>
//   userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
// }

export const MenuDrawerContents = ({ toggleOpen }: MenuContentsProps) => {
  // const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  // // const isInstalled = useMediaQuery("(display-mode: standalone)")

  // useEffect(() => {
  //   const handleBeforeInstallPrompt = (e) => {
  //     e.preventDefault()
  //     setInstallPrompt(e as BeforeInstallPromptEvent)
  //   }

  //   window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

  //   return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
  // }, [])

  // TODO8
  // const promptInstall = () => {
  //   if (installPrompt) {
  //     installPrompt.prompt()
  //     installPrompt.userChoice.then((choiceResult) => {
  //       if (choiceResult.outcome === "accepted") {
  //         console.log("User accepted the install prompt")
  //       } else {
  //         console.log("User dismissed the install prompt")
  //       }
  //       setInstallPrompt(null)
  //     })
  //   }
  // }

  const activeAccountPath = useStore($activeAccountPath)
  const activeAccount = useStore($activeAccount)
  if (!activeAccount) return null

  return (
    <>
      <Stack
        sx={{
          "& .MuiListItemAvatar-root svg": {
            fontSize: "1.25rem",
          },
          "@media (min-width: 990px) and (max-width: 1836px)": {
            "& .MuiListItemAvatar-root": {
              fontSize: "1.5rem",
              marginRight: 0,
            },
            "& .MuiMenuItem-root": {
              alignItems: "center",
              flexDirection: "column",
              gap: 0.5,
              justifyContent: "center",
              minHeight: 64,
              paddingX: 0.5,
              paddingY: 1.5,
            },
            "& .MuiTypography-root": {
              fontSize: "0.75rem",
            },
            gap: "16px",
            paddingX: 0.5,
            paddingY: 1,
          },
          gap: 1,
          height: "100%",
          paddingX: 2,
          paddingY: 1,
          width: "100%",
        }}
        justifyContent="space-between"
      >
        <Stack gap={0.25}>
          <Tooltip title="Visit Welcome">
            <MenuItem
              color="secondary"
              to="/"
              component={Link}
              sx={{
                borderRadius: 0.5,
                justifyContent: "flex-start",
                paddingX: 2,
              }}
            >
              <LogoText
                sx={{
                  display: {
                    md: "none",
                    xs: "inline-flex",
                    xxl: "inline-flex",
                  },
                }}
              />
              <Logo
                color="var(--mui-palette-primary-main)"
                width={24}
                height={24}
                sx={{
                  display: {
                    md: "inline-flex",
                    xs: "none",
                    xxl: "none",
                  },
                }}
              />
            </MenuItem>
          </Tooltip>
          {/* <Stack direction="row" alignItems="center" justifyContent="space-between"> */}
          <AccountPickerButton onClose={toggleOpen} />
          {/* <Tooltip title="Create">
              <IconButton
                size="small"
                sx={{
                  backgroundColor: "var(--mui-palette-action-hover)",
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
                <AddRounded fontSize="small" />
              </IconButton>
            </Tooltip> */}
          {/* </Stack> */}
          <NavMenuItem
            value=""
            to={`${activeAccountPath}`}
            label="Home"
            aria-label="Visit Home"
            onClick={toggleOpen}
            shortcutKey="h"
            avatar={<HomeRounded />}
          />
          <NavMenuItem
            value="trades"
            to={`${activeAccountPath}/trades`}
            label="Trades"
            aria-label="Visit Trades"
            onClick={toggleOpen}
            shortcutKey="r"
            avatar={<CandlestickChartRounded />}
          />
          <NavMenuItem
            value="assistant"
            to={`${activeAccountPath}/assistant`}
            label="Assistant"
            aria-label="Visit Assistant"
            onClick={toggleOpen}
            shortcutKey="i"
            avatar={<AutoAwesomeRounded />}
          />
          <NavMenuItem
            value="assets"
            to={`${activeAccountPath}/assets`}
            label="Assets"
            aria-label="Visit Assets"
            onClick={toggleOpen}
            shortcutKey="a"
            avatar={<Workspaces />}
          />
          <NavMenuItem
            value="transactions"
            to={`${activeAccountPath}/transactions`}
            label="Transactions"
            aria-label="Visit Transactions"
            onClick={toggleOpen}
            shortcutKey="t"
            avatar={<TransactionIcon />}
          />
          <NavMenuItem
            value="audit-logs"
            to={`${activeAccountPath}/audit-logs`}
            label="Audit logs"
            aria-label="Visit Audit logs"
            onClick={toggleOpen}
            shortcutKey="u"
            avatar={<ReceiptLong />}
          />
          <NavMenuItem
            value="platforms"
            to={`${activeAccountPath}/platforms`}
            label="Platforms"
            aria-label="Visit Platforms"
            onClick={toggleOpen}
            shortcutKey="p"
            avatar={<AccountBalanceRounded />}
          />
          <NavMenuItem
            value="extensions"
            to={`${activeAccountPath}/extensions`}
            label="Extensions"
            aria-label="Visit Extensions"
            onClick={toggleOpen}
            shortcutKey="e"
            avatar={<ExtensionRounded />}
          />
          <NavMenuItem
            value="import-data"
            to={`${activeAccountPath}/import-data`}
            label="Data"
            aria-label="Visit Data"
            onClick={toggleOpen}
            shortcutKey="d"
            avatar={<SdStorageRounded />}
          />
          <NavMenuItem
            value="server"
            to={`${activeAccountPath}/server`}
            label="Server"
            aria-label="Visit Server"
            onClick={toggleOpen}
            shortcutKey="s"
            avatar={<CloudRounded />}
          />
          <NavMenuItem
            value="pro-chart"
            to={`${activeAccountPath}/pro-chart`}
            label="Pro chart"
            aria-label="Visit Pro chart"
            onClick={toggleOpen}
            shortcutKey="c"
            avatar={<TimelineRounded />}
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
