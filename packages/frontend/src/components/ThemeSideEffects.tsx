import { useTheme } from "@mui/material"
import React, { useEffect } from "react"
import { bgColor } from "src/theme"

export function ThemeSideEffects() {
  const theme = useTheme()

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

  return <meta name="theme-color" content={bgColor} />
}
