import { Box, Tabs as MuiTabs, tabsClasses, TabsProps as MuiTabsProps } from "@mui/material"
import React, { useEffect, useRef, useState } from "react"
import { SerifFont } from "src/theme"

type TabsProps = MuiTabsProps & {
  largeSize?: boolean
}

export function Tabs({ sx, largeSize, ...rest }: TabsProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(false)

  const updateShadows = () => {
    const el = wrapperRef.current?.querySelector(`.${tabsClasses.scroller}`)
    if (!el) return

    setShowLeftShadow(Math.floor(el.scrollLeft - 2) > 0)
    setShowRightShadow(Math.round(el.scrollLeft + el.clientWidth + 2) < el.scrollWidth)
  }

  useEffect(() => {
    const el = wrapperRef.current?.querySelector(`.${tabsClasses.scroller}`)
    if (!el) return

    updateShadows()
    el.addEventListener("scroll", updateShadows)
    const resizeObserver = new ResizeObserver(updateShadows)
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener("scroll", updateShadows)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <Box sx={{ overflow: "hidden", position: "relative" }} ref={wrapperRef}>
      {showLeftShadow && (
        <div
          style={{
            background:
              "linear-gradient(to right, var(--mui-palette-background-default), transparent)",
            bottom: 0,
            left: 10,
            pointerEvents: "none",
            position: "absolute",
            top: 0,
            width: 32,
            zIndex: 1,
          }}
        />
      )}

      {showRightShadow && (
        <div
          style={{
            background:
              "linear-gradient(to left, var(--mui-palette-background-default), transparent)",
            bottom: 0,
            pointerEvents: "none",
            position: "absolute",
            right: 10,
            top: 0,
            width: 32,
            zIndex: 1,
          }}
        />
      )}

      <MuiTabs
        variant="scrollable"
        scrollButtons={false}
        sx={(theme) => ({
          marginX: 1,
          maxHeight: 42,
          minHeight: 42,
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
            gap: 1,
          },
          [`& .${tabsClasses.flexContainer} > a`]: {
            ...theme.typography.body1,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            fontFamily: SerifFont,
            fontSize: largeSize ? "1.125rem" : "1rem",
            fontWeight: 500,
            letterSpacing: { sm: "0.0375rem", xs: 0 },
            maxHeight: 42,
            minHeight: 42,
            minWidth: 0,
            paddingTop: "2px !important",
            paddingX: 1,
            transition: theme.transitions.create("color"),
          },
          [`& .${tabsClasses.flexContainer} > a:hover`]: {
            color: theme.palette.text.primary,
          },
          ...(typeof sx === "function" ? sx(theme) : {}),
        })}
        {...rest}
      />
    </Box>
  )
}
