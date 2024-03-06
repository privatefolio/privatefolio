import { CloseRounded, GitHub, OpenInNew, Telegram, Twitter } from "@mui/icons-material"
import {
  FormControlLabel,
  IconButton,
  Link as MuiLink,
  MenuItem,
  Stack,
  Switch,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { GIT_DATE } from "src/env"
import { formatDate, formatHour } from "src/utils/formatting-utils"

import { $debugMode, $telemetry, AppVerProps, PopoverToggleProps } from "../../stores/app-store"
import { MonoFont } from "../../theme"
import { SectionTitle } from "../SectionTitle"
import { ReducedMotion } from "./ReducedMotion"
import { ThemeMode } from "./ThemeMode"

const CustomLink = ({ children, ...rest }: any) => (
  <MenuItem
    component={MuiLink}
    tabIndex={0}
    role="button"
    sx={{
      borderRadius: 0.5,
      minHeight: "auto !important",
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

type MenuContentsProps = AppVerProps & PopoverToggleProps

export const SettingsDrawerContents = ({
  appVer,
  gitHash,
  open,
  toggleOpen,
}: MenuContentsProps) => {
  const debugMode = useStore($debugMode)
  const telemetry = useStore($telemetry)

  return (
    <Stack
      paddingX={2}
      paddingY={1}
      gap={4}
      // show={open}
      // secondary
      sx={{ overflowX: "hidden" }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" letterSpacing="0.025rem">
          Settings
        </Typography>
        <IconButton
          onClick={toggleOpen}
          edge="end"
          color="secondary"
          sx={{ display: { sm: "block", xs: "none" } }}
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      </Stack>
      <div>
        <SectionTitle>Theme</SectionTitle>
        <ThemeMode />
      </div>
      <div>
        <SectionTitle>Animations</SectionTitle>
        <ReducedMotion />
      </div>
      <div role="list" aria-labelledby="social-links">
        <SectionTitle id="social-links" role="listitem">
          Community
        </SectionTitle>
        <CustomLink target="_blank" href="https://t.me/privatefolio" role="listitem">
          <Telegram fontSize="small" />
          <span>Telegram</span>
        </CustomLink>
        <CustomLink target="_blank" href="https://discord.gg/5ebfcrZY" role="listitem">
          <svg
            fill="currentColor"
            width="20px"
            height="20px"
            viewBox="0 0 512 512"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M464,66.52A50,50,0,0,0,414.12,17L97.64,16A49.65,49.65,0,0,0,48,65.52V392c0,27.3,22.28,48,49.64,48H368l-13-44L464,496ZM324.65,329.81s-8.72-10.39-16-19.32C340.39,301.55,352.5,282,352.5,282a139,139,0,0,1-27.85,14.25,173.31,173.31,0,0,1-35.11,10.39,170.05,170.05,0,0,1-62.72-.24A184.45,184.45,0,0,1,191.23,296a141.46,141.46,0,0,1-17.68-8.21c-.73-.48-1.45-.72-2.18-1.21-.49-.24-.73-.48-1-.48-4.36-2.42-6.78-4.11-6.78-4.11s11.62,19.09,42.38,28.26c-7.27,9.18-16.23,19.81-16.23,19.81-53.51-1.69-73.85-36.47-73.85-36.47,0-77.06,34.87-139.62,34.87-139.62,34.87-25.85,67.8-25.12,67.8-25.12l2.42,2.9c-43.59,12.32-63.44,31.4-63.44,31.4s5.32-2.9,14.28-6.77c25.91-11.35,46.5-14.25,55-15.21a24,24,0,0,1,4.12-.49,205.62,205.62,0,0,1,48.91-.48,201.62,201.62,0,0,1,72.89,22.95S333.61,145,292.44,132.7l3.39-3.86S329,128.11,363.64,154c0,0,34.87,62.56,34.87,139.62C398.51,293.34,378.16,328.12,324.65,329.81Z" />
            <path d="M212.05,218c-13.8,0-24.7,11.84-24.7,26.57s11.14,26.57,24.7,26.57c13.8,0,24.7-11.83,24.7-26.57C237,229.81,225.85,218,212.05,218Z" />
            <path d="M300.43,218c-13.8,0-24.7,11.84-24.7,26.57s11.14,26.57,24.7,26.57c13.81,0,24.7-11.83,24.7-26.57S314,218,300.43,218Z" />
          </svg>
          <span>Discord</span>
        </CustomLink>
        <CustomLink target="_blank" href="https://twitter.com/kernelwhisperer" role="listitem">
          <Twitter fontSize="small" />
          <span>Twitter</span>
        </CustomLink>
        <CustomLink
          target="_blank"
          href="https://github.com/kernelwhisperer/privatefolio"
          role="listitem"
        >
          <GitHub fontSize="small" />
          <span>GitHub</span>
        </CustomLink>
      </div>
      <div>
        <SectionTitle id="social-links" role="listitem">
          Developer tools
        </SectionTitle>
        <Typography sx={{ opacity: 0.5 }} fontFamily={MonoFont} variant="body2">
          App version: {appVer}
        </Typography>
        <Typography sx={{ opacity: 0.5 }} fontFamily={MonoFont} variant="body2">
          App digest: {gitHash.slice(0, 7)}
        </Typography>
        <Typography sx={{ opacity: 0.5 }} fontFamily={MonoFont} variant="body2">
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
              size="small" // TODO this is not implemented
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
              size="small" // TODO this is not implemented
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
          target="_blank"
          href="https://github.com/kernelwhisperer/privatefolio/issues/new"
          role="listitem"
          component={MuiLink}
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
