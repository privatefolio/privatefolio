import { atom } from "nanostores"

import { logAtoms } from "../utils/browser-utils"

export interface AppVerProps {
  appVer: string
  gitHash: string
}

export interface PopoverToggleProps {
  open: boolean
  toggleOpen: () => void
}

export type ReducedMotionSetting = "always" | "never" | "user"
export const $reducedMotion = atom<ReducedMotionSetting>(
  (localStorage.getItem("privatefolio-reduced-motion") as ReducedMotionSetting) || "user"
)
export const $loopsAllowed = atom<boolean>(false)
export const $debugMode = atom<boolean>(localStorage.getItem("privatefolio-debug-mode") === "true")
export const $telemetry = atom<boolean>(
  localStorage.getItem("privatefolio-no-telemetry") !== "true"
)

logAtoms({ $debugMode, $loopsAllowed, $reducedMotion })
