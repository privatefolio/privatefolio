export const APP_VERSION = extractVersion(import.meta.env.VITE_APP_VERSION)
export const GIT_HASH = import.meta.env.VITE_GIT_HASH || "unknown"
export const GIT_DATE = import.meta.env.VITE_GIT_DATE || "unknown"
export const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
export const TARGET = import.meta.env.VITE_TARGET
export const PLATFORM = TARGET === "electron" ? "electron" : "web"
export const PUBLIC_DIR_LOCATION = TARGET === "electron" ? "./" : "/"
export const STATIC_ASSET_LOCATION = TARGET === "electron" ? "./app-data" : "/app-data"
export const SERVER_PORT = Number(import.meta.env.VITE_SERVER_PORT) || 4001

function extractVersion(version = "") {
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
