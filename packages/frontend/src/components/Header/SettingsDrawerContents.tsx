import {
  GitHub,
  InstallDesktopRounded,
  InstallMobileRounded,
  MailOutlineRounded,
  Twitter,
} from "@mui/icons-material"
import {
  FormControlLabel,
  IconButton,
  LinkProps,
  MenuItem,
  MenuItemProps,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { enqueueSnackbar } from "notistack"
import React from "react"
import { GIT_DATE } from "src/env"
import { useHelpLinks } from "src/hooks/useHelpLinks"
import { useInstallPwa } from "src/hooks/useInstallPwa"
import { formatDate, formatHour } from "src/utils/formatting-utils"

import { $debugMode, $telemetryEnabled, AppVerProps } from "../../stores/app-store"
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

const CustomHelpLink = ({
  children,
  extraButton,
  ...rest
}: MenuItemProps & LinkProps & { extraButton: React.ReactNode }) => (
  <Stack direction="row" gap={1} alignItems="center">
    <MenuItem
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
        width: "100%",
      }}
      {...rest}
    >
      <Typography variant="body2">{children}</Typography>
    </MenuItem>
    {extraButton}
  </Stack>
)

type MenuContentsProps = AppVerProps

export const SettingsDrawerContents = ({ appVer, gitHash }: MenuContentsProps) => {
  const debugMode = useStore($debugMode)
  const telemetry = useStore($telemetryEnabled)

  const { isInstalled, promptInstall } = useInstallPwa()

  const {
    bugGitHubUrl,
    bugEmailUrl,
    featureGitHubUrl,
    featureEmailUrl,
    questionDiscordUrl,
    questionEmailUrl,
  } = useHelpLinks()

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
              <br />
              <br />
              To install this PWA manually, on the right of the address bar, tap <b>More</b> and
              then <b>Add to home screen</b>.
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
              } catch {
                enqueueSnackbar("Failed to install app, try manual install", { variant: "error" })
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
                $telemetryEnabled.set(event.target.checked)
              }}
            />
          }
          label="Telemetry"
          labelPlacement="start"
        />
      </div>
      <div>
        <SectionTitle id="help" role="listitem">
          Help
        </SectionTitle>
        <CustomHelpLink
          href={bugGitHubUrl}
          extraButton={
            <Tooltip title="Report an issue via email">
              <IconButton
                href={bugEmailUrl}
                component={AppLink}
                tabIndex={0}
                size="small"
                color="secondary"
              >
                <MailOutlineRounded fontSize="inherit" />
              </IconButton>
            </Tooltip>
          }
        >
          Report an issue
        </CustomHelpLink>
        <CustomHelpLink
          href={featureGitHubUrl}
          extraButton={
            <Tooltip title="Request a feature via email">
              <IconButton
                href={featureEmailUrl}
                component={AppLink}
                tabIndex={0}
                size="small"
                color="secondary"
              >
                <MailOutlineRounded fontSize="inherit" />
              </IconButton>
            </Tooltip>
          }
        >
          Request a feature
        </CustomHelpLink>
        <CustomHelpLink
          href={questionDiscordUrl}
          extraButton={
            <Tooltip title="Ask a question via email">
              <IconButton
                href={questionEmailUrl}
                component={AppLink}
                tabIndex={0}
                size="small"
                color="secondary"
              >
                <MailOutlineRounded fontSize="inherit" />
              </IconButton>
            </Tooltip>
          }
        >
          Ask a question
        </CustomHelpLink>
      </div>
    </Stack>
  )
}
