import { useTheme } from "@mui/material"
import React, { useEffect } from "react"
import { bgColor } from "src/theme"

export function NavigationBarTheme() {
  const theme = useTheme()

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme.palette.background.default)
  }, [theme.palette.background.default])

  return <meta name="theme-color" content={bgColor} />
}
