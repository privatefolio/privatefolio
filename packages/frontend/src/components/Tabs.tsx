import { Tabs as MuiTabs, tabsClasses, TabsProps as MuiTabsProps } from "@mui/material"
import React from "react"
import { SerifFont } from "src/theme"

type TabsProps = MuiTabsProps & {
  largeSize?: boolean
}

export function Tabs({ sx, largeSize, ...rest }: TabsProps) {
  return (
    <MuiTabs
      variant="scrollable"
      scrollButtons={false}
      sx={(theme) => ({
        marginTop: "-9px",
        marginX: 2,
        [`& .${tabsClasses.indicator}`]: {
          // background: grey[600],
          background: "var(--mui-palette-secondary-main)",
          // background: "var(--mui-palette-accent-main)",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          // borderRadius: 4,
          height: 4,
        },
        [`& .${tabsClasses.flexContainer}`]: {
          gap: 3,
        },
        [`& .${tabsClasses.flexContainer} > a`]: {
          ...theme.typography.body1,
          fontFamily: SerifFont,
          fontSize: largeSize ? "1.25rem" : "1rem",
          fontWeight: 500,
          letterSpacing: 0.66,
          //
          minWidth: 0,
          paddingX: 0,
          transition: theme.transitions.create("color"),
        },
        [`& .${tabsClasses.flexContainer} > a:hover`]: {
          color: theme.palette.text.primary,
        },
        ...(typeof sx === "function" ? sx(theme) : {}),
      })}
      {...rest}
    />
  )
}
