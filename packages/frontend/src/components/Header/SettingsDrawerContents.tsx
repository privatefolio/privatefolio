import {
  GitHub,
  InstallDesktopRounded,
  InstallMobileRounded,
  OpenInNew,
  Twitter,
} from "@mui/icons-material"
import {
  FormControlLabel,
  LinkProps,
  MenuItem,
  MenuItemProps,
  Stack,
  Switch,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { enqueueSnackbar } from "notistack"
import React from "react"
import { GIT_DATE } from "src/env"
import { useInstallPwa } from "src/hooks/useInstallPwa"
import { formatDate, formatHour } from "src/utils/formatting-utils"

import { $debugMode, $telemetry, AppVerProps } from "../../stores/app-store"
import { MonoFont } from "../../theme"
import { AppLink } from "../AppLink"
import { DiscordIcon } from "../DiscordIcon"
import { LearnMore } from "../LearnMore"
import { SectionTitle } from "../SectionTitle"
import { ReducedMotion } from "./ReducedMotion"
import { ThemeMode } from "./ThemeMode"

const CustomLink = ({ children, ...rest }: MenuItemProps & LinkProps) => (
  <MenuItem
    component={AppLink}
    tabIndex={0}
    role="button"
    sx={{
      borderRadius: 0.5,
      minHeight: "auto !important",
      width: "100%",
    }}
    {...rest}
  >
    <Typography
      variant="h6"
      component="div"
      fontWeight={500}
      sx={{
        alignItems: "center",
        display: "flex",
        gap: 1,
      }}
    >
      {children}
    </Typography>
  </MenuItem>
)

type MenuContentsProps = AppVerProps

export const SettingsDrawerContents = ({ appVer, gitHash }: MenuContentsProps) => {
  const debugMode = useStore($debugMode)
  const telemetry = useStore($telemetry)

  const { isInstalled, promptInstall } = useInstallPwa()

  return (
    <Stack
      paddingX={2}
      paddingY={1}
      gap={4}
      // show={open}
      // secondary
      sx={{ overflowX: "hidden" }}
    >
      <div>
        <SectionTitle>Theme</SectionTitle>
        <ThemeMode />
      </div>
      <div>
        <SectionTitle>Animations</SectionTitle>
        <ReducedMotion />
      </div>
      <div>
        <SectionTitle>Apps</SectionTitle>
        <LearnMore
          title={
            <>
              Install the app as a progressive web app (PWA) for faster access and a native app-like
              experience. It works offline and opens in its own window, just like a regular app.
              <br />
              <br />
              If you wish the ability to create local accounts, you must download and install the
              desktop app.
            </>
          }
        >
          <CustomLink
            onClick={async () => {
              if (isInstalled) {
                enqueueSnackbar("App already installed", { variant: "info" })
                return
              }
              try {
                const success = await promptInstall()
                if (success) {
                  enqueueSnackbar("App installed", { variant: "success" })
                }
              } catch (error) {
                console.error(error)
                enqueueSnackbar("Failed to install app", { variant: "error" })
              }
            }}
          >
            <InstallMobileRounded fontSize="small" />
            <Typography variant="inherit" sx={{ fontSize: "1rem" }}>
              Install as PWA
            </Typography>
          </CustomLink>
        </LearnMore>
        <LearnMore
          title={
            <>
              Download and install the native desktop app if you wish to use the local accounts
              feature.
              <br />
              <br />
              Available on Windows, Mac and Linux.
            </>
          }
        >
          <CustomLink href="https://privatefolio.xyz/downloads">
            <InstallDesktopRounded fontSize="small" />
            <Typography variant="inherit" sx={{ fontSize: "1rem" }}>
              Download the Desktop app
            </Typography>
          </CustomLink>
        </LearnMore>
      </div>
      <div role="list" aria-labelledby="social-links">
        <SectionTitle id="social-links" role="listitem">
          Community
        </SectionTitle>
        {/* <CustomLink  href="https://t.me/privatefolio" role="listitem">
          <Telegram fontSize="small" />
          <span>Telegram</span>
        </CustomLink> */}
        <CustomLink href="https://discord.gg/YHHu9nK8VD" role="listitem">
          <DiscordIcon />
          <span>Discord</span>
        </CustomLink>
        <CustomLink href="https://twitter.com/PrivatefolioApp" role="listitem">
          <Twitter fontSize="small" />
          <span>Twitter</span>
        </CustomLink>
        <CustomLink href="https://github.com/privatefolio/privatefolio" role="listitem">
          <GitHub fontSize="small" />
          <span>GitHub</span>
        </CustomLink>
      </div>
      <div>
        <SectionTitle id="social-links" role="listitem">
          Developer tools
        </SectionTitle>
        <Typography color="text.secondary" fontFamily={MonoFont} variant="caption" component="p">
          App version: {appVer}
        </Typography>
        <Typography color="text.secondary" fontFamily={MonoFont} variant="caption" component="p">
          App digest: {gitHash.slice(0, 7)}
        </Typography>
        <Typography color="text.secondary" fontFamily={MonoFont} variant="caption" component="p">
          Build date: {formatDate(new Date(GIT_DATE))}
          {debugMode && ` at ${formatHour(new Date(GIT_DATE))}`}
        </Typography>
        <MenuItem
          role="listitem"
          component={FormControlLabel}
          tabIndex={0}
          sx={{
            "&:hover": {
              color: "text.primary",
            },
            borderRadius: 0.5,
            color: "text.secondary",
            display: "flex",
            justifyContent: "space-between",
            marginTop: 0.5,
            marginX: -1,
            minHeight: "auto !important",
            paddingX: 1,
          }}
          slotProps={{
            typography: {
              variant: "body2",
            },
          }}
          control={
            <Switch
              color="secondary"
              sx={{ marginY: "-3px" }}
              size="small"
              checked={debugMode}
              onChange={(event) => {
                localStorage.setItem(
                  "privatefolio-debug-mode",
                  event.target.checked ? "true" : "false"
                )
                $debugMode.set(event.target.checked)
              }}
            />
          }
          label="Debug mode"
          labelPlacement="start"
        />
        <MenuItem
          role="listitem"
          component={FormControlLabel}
          tabIndex={0}
          sx={{
            "&:hover": {
              color: "text.primary",
            },
            borderRadius: 0.5,
            color: "text.secondary",
            display: "flex",
            justifyContent: "space-between",
            marginX: -1,
            minHeight: "auto !important",
            paddingX: 1,
          }}
          slotProps={{
            typography: {
              variant: "body2",
            },
          }}
          control={
            <Switch
              color="secondary"
              size="small"
              sx={{ marginY: "-3px" }}
              checked={telemetry}
              onChange={(event) => {
                localStorage.setItem(
                  "privatefolio-no-telemetry",
                  event.target.checked ? "false" : "true"
                )
                $telemetry.set(event.target.checked)
              }}
            />
          }
          label="Telemetry"
          labelPlacement="start"
        />
        <MenuItem
          href="https://github.com/privatefolio/privatefolio/issues/new"
          role="listitem"
          component={AppLink}
          tabIndex={0}
          sx={{
            "&:hover": {
              color: "text.primary",
            },
            borderRadius: 0.5,
            color: "text.secondary",
            display: "flex",
            gap: 1,
            marginX: -1,
            paddingX: 1,
          }}
        >
          <Typography variant="body2">Report an issue</Typography>
          <OpenInNew fontSize="inherit" />
        </MenuItem>
      </div>
    </Stack>
  )
}
