export const APP_VERSION =
  "v" + import.meta.env.VITE_APP_VERSION?.split("\n")[0].replaceAll('"', "")
export const GIT_HASH = import.meta.env.VITE_GIT_HASH
export const GIT_DATE = import.meta.env.VITE_GIT_DATE
export const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
