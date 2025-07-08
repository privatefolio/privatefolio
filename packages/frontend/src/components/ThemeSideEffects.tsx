import { useTheme } from "@mui/material"
import React, { useEffect } from "react"
import { bgColor } from "src/theme"
import { $colorArray } from "src/utils/color-utils"
import { setElectronMode } from "src/utils/electron-utils"

export function ThemeSideEffects() {
  const theme = useTheme()

  useEffect(() => {
    setElectronMode?.(theme.palette.mode)
  }, [theme.palette.mode])

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme.palette.background.default)
  }, [theme.palette.background.default])

  useEffect(() => {
    if (window.location.protocol === "http:") {
      document.querySelector('link[rel*="icon"]')?.setAttribute("href", "/privatefolio-local.svg")
    }
  }, [])

  useEffect(() => {
    $colorArray.set(Object.values(theme.palette.color))
  }, [theme.palette.color])

  return <meta name="theme-color" content={bgColor} />
}
