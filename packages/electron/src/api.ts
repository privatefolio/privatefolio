import { TitleBarOverlay } from "electron"

export const TITLE_BAR_OPTS: Record<"dark" | "light", TitleBarOverlay> = {
  dark: {
    color: "rgb(30, 30, 30)",
    height: 52,
    symbolColor: "rgb(160, 160, 160)",
  },
  light: {
    color: "rgb(242, 243, 245)",
    height: 52,
    symbolColor: "rgb(120, 120, 120)",
  },
}
