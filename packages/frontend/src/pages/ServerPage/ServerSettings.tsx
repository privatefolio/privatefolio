import { Info } from "@mui/icons-material"
import {
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { enqueueSnackbar } from "notistack"
import React, { MouseEvent, useEffect, useState } from "react"
import { SectionTitle } from "src/components/SectionTitle"

import { DEFAULT_CRON_REFRESH_INTERVAL } from "../../settings"
import { $activeAccount } from "../../stores/account-store"
import { $rpc } from "../../workers/remotes"

// Predefined refresh interval options in minutes
const REFRESH_INTERVALS = [
  { label: "5min", value: 5 },
  { label: "1h", value: 60 },
  { label: "4h", value: 240 },
  { label: "24h", value: 1440 },
]

export function ServerSettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [cronInterval, setCronInterval] = useState(DEFAULT_CRON_REFRESH_INTERVAL)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    if (!activeAccount) return

    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const settings = await $rpc.get().getSettings(activeAccount)
        setCronInterval(settings.refreshInterval)
        // Check if the loaded value matches any predefined interval
        setIsCustomMode(
          !REFRESH_INTERVALS.some((option) => option.value === settings.refreshInterval)
        )
      } catch (error) {
        console.error("Failed to load settings:", error)
        enqueueSnackbar("Failed to load settings", { variant: "error" })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [activeAccount])

  const handleSave = async () => {
    if (!activeAccount) return

    setIsSaving(true)

    try {
      await $rpc.get().updateSettings(activeAccount, {
        refreshInterval: cronInterval,
      })
      enqueueSnackbar("Settings saved successfully", { variant: "success" })
    } catch (error) {
      console.error("Failed to save settings:", error)
      enqueueSnackbar("Failed to save settings", { variant: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleIntervalChange = (_: MouseEvent<HTMLElement>, value: number | "custom" | null) => {
    if (value !== null) {
      if (value === "custom") {
        setIsCustomMode(true)
        // Retain the current interval value
      } else {
        setIsCustomMode(false)
        setCronInterval(value)
      }
    }
  }

  const handleCustomIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      setCronInterval(value)
    }
  }

  // Determine which value to show in the toggle group
  const toggleValue = isCustomMode ? "custom" : cronInterval

  return (
    <Paper sx={{ paddingX: 2, paddingY: 2 }}>
      <Stack gap={2}>
        <Stack gap={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SectionTitle>Refresh Interval</SectionTitle>
            <Tooltip
              title={`How often the server will automatically refresh balances, prices, and networth.
                  Default is ${DEFAULT_CRON_REFRESH_INTERVAL} minutes.`}
            >
              <IconButton size="small" aria-label="Help with cron expressions" color="secondary">
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <ToggleButtonGroup
            value={toggleValue}
            exclusive
            onChange={handleIntervalChange}
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
            <Stack direction="row" spacing={2} alignItems="center">
              <SectionTitle>Custom interval:</SectionTitle>
              <TextField
                disabled={isLoading}
                value={cronInterval}
                onChange={handleCustomIntervalChange}
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                  inputProps: { min: 1 },
                }}
                sx={{ width: 160 }}
                size="small"
              />
            </Stack>
          )}
        </Stack>

        <div>
          <Button variant="contained" onClick={handleSave} disabled={isLoading || isSaving}>
            Save
          </Button>
        </div>
      </Stack>
    </Paper>
  )
}
