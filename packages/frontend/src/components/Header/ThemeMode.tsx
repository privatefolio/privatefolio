import { DarkModeOutlined, LightMode, SettingsBrightness } from "@mui/icons-material"
import { Tab, useColorScheme } from "@mui/material"
import React from "react"

import { TabsAlt } from "../TabsAlt"

export function ThemeMode() {
  const { mode = "system", setMode } = useColorScheme()
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    const newMode = newValue === 0 ? "light" : newValue === 1 ? "system" : "dark"
    setMode(newMode)
  }

  return (
    <TabsAlt
      value={mode === "light" ? 0 : mode === "system" ? 1 : 2}
      onChange={handleTabChange}
      largeSize
    >
      <Tab label="Light" icon={<LightMode />} iconPosition="start" />
      <Tab label="System" icon={<SettingsBrightness />} iconPosition="start" />
      <Tab label="Dark" icon={<DarkModeOutlined />} iconPosition="start" />
    </TabsAlt>
  )
}
