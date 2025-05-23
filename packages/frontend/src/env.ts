export const APP_VERSION = extractVersion(import.meta.env.VITE_APP_VERSION)
export const GIT_HASH = import.meta.env.VITE_GIT_HASH
export const GIT_DATE = import.meta.env.VITE_GIT_DATE
export const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
export const TARGET = import.meta.env.VITE_TARGET
export const PLATFORM = TARGET === "electron" ? "electron" : "web"

function extractVersion(version: string) {
  try {
    const raw = version.split("\n")[0]

    if (raw.startsWith("{")) {
      const json = JSON.parse(version)
      return "v" + json[Object.keys(json)[0]]
    }

    return "v" + raw.replaceAll('"', "").replaceAll("'", "")
  } catch {
    return "unknown"
  }
}
