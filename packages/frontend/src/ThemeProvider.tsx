import {
  CssBaseline,
  CssVarsThemeOptions,
  Experimental_CssVarsProvider as CssVarsProvider,
  experimental_extendTheme as extendTheme,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { Globals, useReducedMotion } from "@react-spring/web"
import { merge } from "lodash-es"
import React, { PropsWithChildren, useEffect, useMemo } from "react"

import { ThemeSideEffects } from "./components/ThemeSideEffects"
import { useBreakpoints } from "./hooks/useBreakpoints"
import { $reducedMotion } from "./stores/app-store"
import { theme } from "./theme"

export function ThemeProvider({ children }: PropsWithChildren) {
  const reducedMotion = useStore($reducedMotion)
  const browserPreference = useReducedMotion()

  const { isMobile, isTablet, isDesktop } = useBreakpoints()

  const skipAnimation = useMemo(() => {
    if (reducedMotion === "never") {
      return false
    } else if (reducedMotion === "always") {
      return true
    } else if (browserPreference) {
      return browserPreference
    } else {
      return isMobile
    }
  }, [reducedMotion, browserPreference, isMobile])

  useEffect(() => {
    Globals.assign({ skipAnimation })
  }, [skipAnimation])

  const extendedTheme = useMemo(
    () =>
      extendTheme(
        merge(
          {},
          theme,
          {
            components: {
              MuiDialog: {
                defaultProps: {
                  fullScreen: !isDesktop,
                },
              },
              MuiDrawer: {
                defaultProps: {
                  // disableScrollLock: !isTablet,
                  slotProps: { backdrop: { invisible: !isTablet } },
                },
              },
              MuiPopover: {
                defaultProps: {
                  // disableScrollLock: !isTablet,
                },
              },
            },
          },
          skipAnimation
            ? ({
                components: {
                  MuiButtonBase: {
                    defaultProps: {
                      disableRipple: true, // No more ripple, on the whole application 💣!
                    },
                  },
                  MuiSkeleton: {
                    defaultProps: {
                      animation: false,
                    },
                  },
                },
                transitions: {
                  // So we have `transition: none;` everywhere
                  create: () => "none",
                },
              } as CssVarsThemeOptions)
            : {}
        )
      ),
    [isDesktop, isTablet, skipAnimation]
  )

  // console.log("ThemeProvider > extendedTheme:", extendedTheme)
  return (
    <CssVarsProvider defaultMode="system" theme={extendedTheme} disableTransitionOnChange>
      <CssBaseline enableColorScheme />
      {children}
      <ThemeSideEffects />
    </CssVarsProvider>
  )
}
