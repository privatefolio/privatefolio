import {
  CssBaseline,
  Experimental_CssVarsProvider as CssVarsProvider,
  experimental_extendTheme as extendTheme,
  useMediaQuery,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { Globals, useReducedMotion } from "@react-spring/web"
import { merge } from "lodash"
import React, { PropsWithChildren, useEffect, useMemo } from "react"

import { $reducedMotion } from "./stores/app-store"
import { theme } from "./theme"

export function ThemeProvider({ children }: PropsWithChildren) {
  const reducedMotion = useStore($reducedMotion)
  const userPreference = useReducedMotion()

  const isMobile = useMediaQuery("(max-width: 960px)")
  // const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down("md"))

  const skipAnimation = useMemo(() => {
    if (reducedMotion === "never") {
      return false
    } else if (reducedMotion === "always") {
      return true
    } else if (userPreference) {
      return userPreference
    } else {
      return isMobile
    }
  }, [reducedMotion, userPreference, isMobile])

  useEffect(() => {
    Globals.assign({ skipAnimation })
  }, [skipAnimation])

  const extendedTheme = useMemo(
    () =>
      extendTheme(
        merge(
          {},
          theme,
          skipAnimation
            ? {
                components: {
                  MuiButtonBase: {
                    defaultProps: {
                      disableRipple: true, // No more ripple, on the whole application 💣!
                    },
                  },
                },
                transitions: {
                  // So we have `transition: none;` everywhere
                  create: () => "none",
                },
              }
            : {}
        )
      ),
    [skipAnimation]
  )
  return (
    <>
      <CssVarsProvider defaultMode="system" theme={extendedTheme} disableTransitionOnChange>
        <CssBaseline enableColorScheme />
        {children}
      </CssVarsProvider>
    </>
  )
}