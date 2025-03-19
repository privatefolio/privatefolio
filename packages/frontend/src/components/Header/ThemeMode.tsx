import { DarkModeOutlined, LightMode, SettingsBrightness } from "@mui/icons-material"
import { Tab, Tabs, tabsClasses, useColorScheme } from "@mui/material"
import React from "react"

export function ThemeMode() {
  const { mode = "system", setMode } = useColorScheme()
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    const newMode = newValue === 0 ? "light" : newValue === 1 ? "system" : "dark"
    setMode(newMode)
  }

  return (
    <>
      <Tabs
        variant="fullWidth"
        // textColor="inherit"
        value={mode === "light" ? 0 : mode === "system" ? 1 : 2}
        onChange={handleTabChange}
        sx={(theme) => ({
          background: "var(--mui-palette-background-default)",
          borderRadius: 1,
          padding: 0.5,
          [`& .${tabsClasses.indicator}`]: {
            background: "var(--mui-palette-background-paper)",
            backgroundImage: "var(--mui-overlays-2)",
            borderRadius: 0.75,
            height: "100%",
          },
          [`& .${tabsClasses.flexContainer}`]: {
            gap: 0.5,
          },
          [`& .${tabsClasses.flexContainer} > button`]: {
            borderRadius: 0.75,
            minHeight: 20,
            textTransform: "none !important",
            transition: theme.transitions.create("color"),
            willChange: "background",
            zIndex: 2,
          },
          [`& .${tabsClasses.flexContainer} > button:hover`]: {
            color: theme.palette.text.primary,
          },
        })}
      >
        <Tab label="Light" icon={<LightMode />} iconPosition="start" />
        <Tab label="System" icon={<SettingsBrightness />} iconPosition="start" />
        <Tab label="Dark" icon={<DarkModeOutlined />} iconPosition="start" />
      </Tabs>
    </>
  )
}
