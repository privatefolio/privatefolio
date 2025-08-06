import {
  Button,
  FormHelperText,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { enqueueSnackbar } from "notistack"
import { ONE_DAY_TIME } from "privatefolio-backend/src/utils/formatting-utils"
import React, { MouseEvent, useEffect, useState } from "react"
import { DefaultErrorMessage } from "src/components/DefaultErrorMessage"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { LearnMore } from "src/components/LearnMore"
import { SectionTitle } from "src/components/SectionTitle"

import { $activeAccount } from "../../stores/account-store"
import { $rpc } from "../../workers/remotes"

const isValidInterval = (minutes: number): boolean => {
  if (minutes <= 0) return false
  // This logic mirrors the backend's getCronExpression function's valid cases.
  // It allows intervals less than 60 minutes, or intervals that are whole hours or whole days.
  return minutes < 60 || minutes % 60 === 0
}

// Predefined server health cron interval options in minutes
const HEALTH_METRICS_INTERVALS = [
  { label: "1 min", value: 1 },
  { label: "5 min", value: 5 },
  { label: "1 hour", value: 60 },
  { label: "4 hours", value: 240 },
]

// Predefined system info refresh interval options in minutes
const SYSTEM_INFO_INTERVALS = [
  { label: "1 day", value: ONE_DAY_TIME },
  { label: "7 days", value: 7 * ONE_DAY_TIME },
  { label: "30 days", value: 30 * ONE_DAY_TIME },
]

export function ServerSettings() {
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Server settings - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const [isLoading, setIsLoading] = useState(true)
  const [healthMetricsInterval, setHealthMetricsInterval] = useState(5)
  const [isHealthCustomMode, setIsHealthCustomMode] = useState(false)
  const [isHealthIntervalValid, setIsHealthIntervalValid] = useState(true)
  const [systemInfoInterval, setSystemInfoInterval] = useState(1440)
  const [isSystemInfoCustomMode, setIsSystemInfoCustomMode] = useState(false)
  const [isSystemInfoIntervalValid, setIsSystemInfoIntervalValid] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!activeAccount) return

    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const serverSettings = await rpc.getServerSettings()
        setHealthMetricsInterval(serverSettings.healthMetricsInterval)
        setSystemInfoInterval(serverSettings.systemInfoInterval)

        const isHealthCustom = !HEALTH_METRICS_INTERVALS.some(
          (option) => option.value === serverSettings.healthMetricsInterval
        )
        setIsHealthCustomMode(isHealthCustom)
        setIsHealthIntervalValid(
          isHealthCustom ? isValidInterval(serverSettings.healthMetricsInterval) : true
        )

        const isSystemInfoCustom = !SYSTEM_INFO_INTERVALS.some(
          (option) => option.value === serverSettings.systemInfoInterval
        )
        setIsSystemInfoCustomMode(isSystemInfoCustom)
        setIsSystemInfoIntervalValid(
          isSystemInfoCustom ? isValidInterval(serverSettings.systemInfoInterval) : true
        )
      } catch (error) {
        console.error("Failed to load settings:", error)
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
      await rpc.updateServerSettings({
        healthMetricsInterval,
        systemInfoInterval,
      })
      enqueueSnackbar("Server settings saved", { variant: "success" })
    } catch (error) {
      console.error("Failed to save server settings:", error)
      enqueueSnackbar("Failed to save server settings", { variant: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleHealthIntervalChange = (
    _: MouseEvent<HTMLElement>,
    value: number | "custom" | null
  ) => {
    if (value !== null) {
      if (value === "custom") {
        setIsHealthCustomMode(true)
        setIsHealthIntervalValid(isValidInterval(healthMetricsInterval))
      } else {
        setIsHealthCustomMode(false)
        setHealthMetricsInterval(value)
        setIsHealthIntervalValid(true) // Predefined are always valid
      }
    }
  }

  const handleHealthCustomIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.includes(".")) {
      setHealthMetricsInterval(parseFloat(e.target.value))
      setIsHealthIntervalValid(false)
      return
    }

    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      setHealthMetricsInterval(value)
      setIsHealthIntervalValid(isValidInterval(value))
    } else {
      setHealthMetricsInterval(value || 0)
      setIsHealthIntervalValid(false)
    }
  }

  const handleSystemInfoIntervalChange = (
    _: MouseEvent<HTMLElement>,
    value: number | "custom" | null
  ) => {
    if (value !== null) {
      if (value === "custom") {
        setIsSystemInfoCustomMode(true)
        setIsSystemInfoIntervalValid(isValidInterval(systemInfoInterval))
      } else {
        setIsSystemInfoCustomMode(false)
        setSystemInfoInterval(value)
        setIsSystemInfoIntervalValid(true) // Predefined are always valid
      }
    }
  }

  const handleSystemInfoCustomIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.includes(".")) {
      setSystemInfoInterval(parseFloat(e.target.value) * 1440)
      setIsSystemInfoIntervalValid(false)
      return
    }

    const valueInDays = parseInt(e.target.value, 10)
    if (!isNaN(valueInDays) && valueInDays > 0) {
      const valueInMinutes = valueInDays * 1440
      setSystemInfoInterval(valueInMinutes)
      setIsSystemInfoIntervalValid(isValidInterval(valueInMinutes))

      // If the custom value matches a predefined option, switch back to the toggle button
      if (SYSTEM_INFO_INTERVALS.some((option) => option.value === valueInMinutes)) {
        setIsSystemInfoCustomMode(false)
      }
    } else {
      setSystemInfoInterval(0) // invalid
      setIsSystemInfoIntervalValid(false)
    }
  }

  // Determine which value to show in the toggle group
  const healthToggleValue = isHealthCustomMode ? "custom" : healthMetricsInterval
  const systemInfoToggleValue = isSystemInfoCustomMode ? "custom" : systemInfoInterval

  if (isLoading) return <DefaultSpinner wrapper />
  if (error) return <DefaultErrorMessage error={error} />

  return (
    <Paper sx={{ paddingX: 2, paddingY: 1 }}>
      <Stack gap={2}>
        <Stack gap={1}>
          <LearnMore title={`How often to collect and store system health metrics.`}>
            <SectionTitle>Health Metrics Interval</SectionTitle>
          </LearnMore>
          <ToggleButtonGroup
            value={healthToggleValue}
            exclusive
            onChange={handleHealthIntervalChange}
            disabled={isLoading}
            aria-label="health metrics refresh interval"
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
            {HEALTH_METRICS_INTERVALS.map((option) => (
              <ToggleButton key={option.label} value={option.value}>
                {option.label}
              </ToggleButton>
            ))}
            <ToggleButton value={"custom" as const}>Custom</ToggleButton>
          </ToggleButtonGroup>

          {isHealthCustomMode && (
            <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
              <SectionTitle>Custom interval:</SectionTitle>
              <TextField
                error={!isHealthIntervalValid}
                disabled={isLoading}
                value={healthMetricsInterval || ""}
                onChange={handleHealthCustomIntervalChange}
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                  inputProps: { min: 1 },
                }}
                sx={{ width: 160 }}
                size="small"
              />
              {!isHealthIntervalValid && (
                <FormHelperText error>Must be &lt; 60, or a whole number of hours.</FormHelperText>
              )}
            </Stack>
          )}
        </Stack>

        <Stack gap={1}>
          <LearnMore
            title={`How often to refresh and update static system information (CPU, memory, platform details).`}
          >
            <SectionTitle>System Info Interval</SectionTitle>
          </LearnMore>
          <ToggleButtonGroup
            value={systemInfoToggleValue}
            exclusive
            onChange={handleSystemInfoIntervalChange}
            disabled={isLoading}
            aria-label="system info refresh interval"
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
            {SYSTEM_INFO_INTERVALS.map((option) => (
              <ToggleButton key={option.label} value={option.value}>
                {option.label}
              </ToggleButton>
            ))}
            <ToggleButton value={"custom" as const}>Custom</ToggleButton>
          </ToggleButtonGroup>

          {isSystemInfoCustomMode && (
            <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
              <SectionTitle>Custom interval:</SectionTitle>
              <TextField
                error={!isSystemInfoIntervalValid}
                disabled={isLoading}
                value={systemInfoInterval > 0 ? systemInfoInterval / 1440 : ""}
                onChange={handleSystemInfoCustomIntervalChange}
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">days</InputAdornment>,
                  inputProps: { min: 1 },
                }}
                sx={{ width: 160 }}
                size="small"
              />
              {!isSystemInfoIntervalValid && (
                <FormHelperText error>Must be a whole number of days.</FormHelperText>
              )}
            </Stack>
          )}
        </Stack>

        <div>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              isLoading ||
              isSaving ||
              (isHealthCustomMode && !isHealthIntervalValid) ||
              (isSystemInfoCustomMode && !isSystemInfoIntervalValid)
            }
          >
            Save
          </Button>
        </div>
      </Stack>
    </Paper>
  )
}
