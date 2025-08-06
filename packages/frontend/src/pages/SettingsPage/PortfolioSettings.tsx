import {
  Button,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { enqueueSnackbar } from "notistack"
import { ONE_DAY_MIN } from "privatefolio-backend/src/utils/formatting-utils"
import React, { MouseEvent, useEffect, useState } from "react"
import { DefaultErrorMessage } from "src/components/DefaultErrorMessage"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { LearnMore } from "src/components/LearnMore"
import { SectionTitle } from "src/components/SectionTitle"

import { DEFAULT_SETTINGS } from "../../settings"
import { $activeAccount } from "../../stores/account-store"
import { $rpc } from "../../workers/remotes"

const isValidInterval = (minutes: number): boolean => {
  if (minutes <= 0) return false
  // This logic mirrors the backend's getCronExpression function's valid cases.
  // It allows intervals less than 60 minutes, or intervals that are whole hours or whole days.
  return minutes < 60 || minutes % 60 === 0
}

// Predefined refresh interval options in minutes
const REFRESH_INTERVALS = [
  { label: "5 min", value: 5 },
  { label: "1 hour", value: 60 },
  { label: "4 hours", value: 240 },
  { label: "1 day", value: ONE_DAY_MIN },
]

// Predefined refresh interval options in minutes
const METADATA_REFRESH_INTERVALS = [
  { label: "1 day", value: ONE_DAY_MIN },
  { label: "7 days", value: 7 * ONE_DAY_MIN },
  { label: "30 days", value: 30 * ONE_DAY_MIN },
]

export function PortfolioSettings() {
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Portfolio settings - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const [isLoading, setIsLoading] = useState(true)
  const [networthRefreshInterval, setNetworthCronInterval] = useState(
    DEFAULT_SETTINGS.networthRefreshInterval
  )
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [isNetworthIntervalValid, setIsNetworthIntervalValid] = useState(true)
  const [kioskMode, setKioskMode] = useState(false)

  const [metadataRefreshInterval, setMetadataCronInterval] = useState(
    DEFAULT_SETTINGS.metadataRefreshInterval
  )
  const [isMetadataCustomMode, setIsMetadataCustomMode] = useState(false)
  const [isMetadataIntervalValid, setIsMetadataIntervalValid] = useState(true)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!activeAccount) return

    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const savedSettings = await rpc.getSettings(activeAccount)
        const settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings)

        setNetworthCronInterval(settings.networthRefreshInterval)
        setMetadataCronInterval(settings.metadataRefreshInterval)
        setKioskMode(settings.kioskMode ?? false)

        // Check if the loaded value matches any predefined interval
        const isNetworthCustom = !REFRESH_INTERVALS.some(
          (option) => option.value === settings.networthRefreshInterval
        )
        setIsCustomMode(isNetworthCustom)
        setIsNetworthIntervalValid(
          isNetworthCustom ? isValidInterval(settings.networthRefreshInterval) : true
        )

        const isMetadataCustom = !METADATA_REFRESH_INTERVALS.some(
          (option) => option.value === settings.metadataRefreshInterval
        )
        setIsMetadataCustomMode(isMetadataCustom)
        setIsMetadataIntervalValid(
          isMetadataCustom ? isValidInterval(settings.metadataRefreshInterval) : true
        )
      } catch (error) {
        console.error("Failed to load portfolio settings:", error)
        setError(error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [activeAccount, rpc])

  const handleSave = async () => {
    if (!activeAccount) return

    setIsSaving(true)

    try {
      await rpc.updateSettings(activeAccount, {
        kioskMode,
        metadataRefreshInterval,
        networthRefreshInterval,
      })
      enqueueSnackbar("Portfolio settings saved", { variant: "success" })
    } catch (error) {
      console.error("Failed to save portfolio settings:", error)
      enqueueSnackbar("Failed to save portfolio settings", { variant: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleNetworthIntervalChange = (
    _: MouseEvent<HTMLElement>,
    value: number | "custom" | null
  ) => {
    if (value !== null) {
      if (value === "custom") {
        setIsCustomMode(true)
        setIsNetworthIntervalValid(isValidInterval(networthRefreshInterval))
      } else {
        setIsCustomMode(false)
        setNetworthCronInterval(value)
        setIsNetworthIntervalValid(true) // Predefined are always valid
      }
    }
  }

  const handleNetworthCustomIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.includes(".")) {
      setNetworthCronInterval(parseFloat(e.target.value))
      setIsNetworthIntervalValid(false)
      return
    }

    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      setNetworthCronInterval(value)
      setIsNetworthIntervalValid(isValidInterval(value))
    } else {
      setNetworthCronInterval(value || 0)
      setIsNetworthIntervalValid(false)
    }
  }

  const handleMetadataIntervalChange = (
    _: MouseEvent<HTMLElement>,
    value: number | "custom" | null
  ) => {
    if (value !== null) {
      if (value === "custom") {
        setIsMetadataCustomMode(true)
        setIsMetadataIntervalValid(isValidInterval(metadataRefreshInterval))
      } else {
        setIsMetadataCustomMode(false)
        setMetadataCronInterval(value)
        setIsMetadataIntervalValid(true) // Predefined are always valid
      }
    }
  }

  const handleMetadataCustomIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.includes(".")) {
      setMetadataCronInterval(parseFloat(e.target.value) * 1440)
      setIsMetadataIntervalValid(false)
      return
    }

    const valueInDays = parseInt(e.target.value, 10)
    if (!isNaN(valueInDays) && valueInDays > 0) {
      const valueInMinutes = valueInDays * 1440
      setMetadataCronInterval(valueInMinutes)
      setIsMetadataIntervalValid(isValidInterval(valueInMinutes))

      // If the custom value matches a predefined option, switch back to the toggle button
      if (METADATA_REFRESH_INTERVALS.some((option) => option.value === valueInMinutes)) {
        setIsMetadataCustomMode(false)
      }
    } else {
      setMetadataCronInterval(0) // invalid
      setIsMetadataIntervalValid(false)
    }
  }

  // Determine which value to show in the toggle group
  const networthToggleValue = isCustomMode ? "custom" : networthRefreshInterval
  const metadataToggleValue = isMetadataCustomMode ? "custom" : metadataRefreshInterval

  if (isLoading) return <DefaultSpinner wrapper />
  if (error) return <DefaultErrorMessage error={error} />

  return (
    <Paper sx={{ paddingX: 2, paddingY: 1 }}>
      <Stack gap={2}>
        <Stack gap={1}>
          <LearnMore
            title={`How often to refresh balances, prices, and networth.
                    Default is ${DEFAULT_SETTINGS.networthRefreshInterval} minutes.`}
          >
            <SectionTitle>Networth Refresh Interval</SectionTitle>
          </LearnMore>
          <ToggleButtonGroup
            value={networthToggleValue}
            exclusive
            onChange={handleNetworthIntervalChange}
            disabled={isLoading}
            aria-label="refresh interval"
            color="primary"
            sx={{
              "& .MuiButtonBase-root": {
                minWidth: 64,
                paddingX: 2,
                paddingY: 0.75,
                textTransform: "none",
              },
            }}
          >
            {REFRESH_INTERVALS.map((option) => (
              <ToggleButton key={option.label} value={option.value}>
                {option.label}
              </ToggleButton>
            ))}
            <ToggleButton value={"custom" as const}>Custom</ToggleButton>
          </ToggleButtonGroup>

          {isCustomMode && (
            <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
              <SectionTitle>Custom interval:</SectionTitle>
              <TextField
                error={!isNetworthIntervalValid}
                disabled={isLoading}
                value={networthRefreshInterval || ""}
                onChange={handleNetworthCustomIntervalChange}
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                  inputProps: { min: 1 },
                }}
                sx={{ width: 160 }}
                size="small"
              />
              {!isNetworthIntervalValid && (
                <FormHelperText error>Must be &lt; 60, or a whole number of hours.</FormHelperText>
              )}
            </Stack>
          )}
        </Stack>

        <Stack gap={1}>
          <LearnMore title={`How often to automatically refetch assets and platforms metadata.`}>
            <SectionTitle>Metadata Refresh Interval</SectionTitle>
          </LearnMore>
          <ToggleButtonGroup
            value={metadataToggleValue}
            exclusive
            onChange={handleMetadataIntervalChange}
            disabled={isLoading}
            aria-label="metadata refresh interval"
            color="primary"
            sx={{
              "& .MuiButtonBase-root": {
                minWidth: 64,
                paddingX: 2,
                paddingY: 0.75,
                textTransform: "none",
              },
            }}
          >
            {METADATA_REFRESH_INTERVALS.map((option) => (
              <ToggleButton key={option.label} value={option.value}>
                {option.label}
              </ToggleButton>
            ))}
            <ToggleButton value={"custom" as const}>Custom</ToggleButton>
          </ToggleButtonGroup>

          {isMetadataCustomMode && (
            <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
              <SectionTitle>Custom interval:</SectionTitle>
              <TextField
                error={!isMetadataIntervalValid}
                disabled={isLoading}
                value={metadataRefreshInterval > 0 ? metadataRefreshInterval / 1440 : ""}
                onChange={handleMetadataCustomIntervalChange}
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">days</InputAdornment>,
                  inputProps: { min: 1 },
                }}
                sx={{ width: 160 }}
                size="small"
              />
              {!isMetadataIntervalValid && (
                <FormHelperText error>Must be a whole number of days.</FormHelperText>
              )}
            </Stack>
          )}
        </Stack>
        <Stack gap={1}>
          <LearnMore
            title={`When enabled, inspecting this account becomes available to everyone. Making changes to this account will still require authentication.`}
          >
            <SectionTitle>Kiosk Mode</SectionTitle>
          </LearnMore>
          <FormControlLabel
            sx={{
              "&:not(:hover)": {
                color: "var(--mui-palette-secondary-main)",
              },
              gap: 1,
              marginLeft: 0,
            }}
            control={
              <Switch
                checked={kioskMode}
                onChange={(e) => setKioskMode(e.target.checked)}
                disabled={isLoading}
                color="secondary"
                size="small"
              />
            }
            label="Make this account public"
          />
        </Stack>

        <div>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              isLoading ||
              isSaving ||
              (isCustomMode && !isNetworthIntervalValid) ||
              (isMetadataCustomMode && !isMetadataIntervalValid)
            }
          >
            Save
          </Button>
        </div>
      </Stack>
    </Paper>
  )
}
