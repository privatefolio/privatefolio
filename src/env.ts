export const GITHUB_CI = import.meta.env.GITHUB_CI === "true"
export const APP_VERSION = import.meta.env.VITE_APP_VERSION?.replaceAll('"', "")
export const GIT_HASH = import.meta.env.VITE_GIT_HASH
export const GIT_DATE = import.meta.env.VITE_GIT_DATE
export const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
