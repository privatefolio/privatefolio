import { useMediaQuery, useTheme } from "@mui/material"

export function useBreakpoints() {
  const theme = useTheme()

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))
  const isDesktop = !isMobile && !isTablet

  return { isDesktop, isMobile, isTablet }
}
