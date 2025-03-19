import { TitleBarOverlay } from "electron"

export const TITLE_BAR_OPTS: Record<"dark" | "light", TitleBarOverlay> = {
  dark: {
    color: "rgb(30, 30, 30)",
    height: 48,
    symbolColor: "#fff",
  },
  light: {
    color: "rgb(237, 238, 242)",
    height: 48,
    symbolColor: "#121212",
  },
}
