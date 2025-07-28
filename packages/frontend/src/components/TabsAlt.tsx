import { Tabs, tabsClasses, TabsProps } from "@mui/material"
import React from "react"

export function TabsAlt(props: TabsProps & { largeSize?: boolean }) {
  const { largeSize, ...rest } = props
  return (
    <Tabs
      variant="fullWidth"
      // textColor="inherit"
      sx={(theme) => ({
        background: "var(--mui-palette-background-default)",
        borderRadius: 1,
        minHeight: largeSize ? undefined : "unset",
        padding: 0.5,
        [`& .${tabsClasses.indicator}`]: {
          background: "var(--mui-palette-background-paper)",
          backgroundImage: "var(--mui-overlays-2)",
          borderRadius: largeSize ? 0.75 : 0.5,
          height: "100%",
        },
        [`& .${tabsClasses.flexContainer}`]: {
          gap: 0.5,
        },
        [`& .${tabsClasses.flexContainer} > button`]: {
          borderRadius: 0.75,
          minHeight: 20,
          padding: largeSize ? undefined : 0.5,
          textTransform: "none !important",
          transition: theme.transitions.create("color"),
          willChange: "background",
          zIndex: 2,
        },
        [`& .${tabsClasses.flexContainer} > button:hover`]: {
          color: theme.palette.text.primary,
        },
      })}
      {...rest}
    />
  )
}
