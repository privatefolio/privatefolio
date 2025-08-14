import { atom } from "nanostores"
import type { PostHog } from "posthog-js"

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
export const $telemetryEnabled = atom<boolean>(
  localStorage.getItem("privatefolio-no-telemetry") !== "true"
)

export const $telemetry = atom<PostHog | null>(null)

logAtoms({ $debugMode, $loopsAllowed, $reducedMotion })

async function getLatestGitHubRelease() {
  const res = await fetch("https://api.github.com/repos/privatefolio/privatefolio/releases/latest")
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const release = await res.json()
  return release
}

export async function getLatestAppVersion() {
  const release = await getLatestGitHubRelease()
  return release.tag_name as string
}
