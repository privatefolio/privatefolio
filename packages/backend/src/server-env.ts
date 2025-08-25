import { isServer } from "./utils/environment-utils"

export const GITHUB_CI = isServer && process.env.GITHUB_CI === "true"
export const APP_VERSION = isServer && extractVersion(process.env.APP_VERSION)
// export const PRIVATE_CLOUD_URL = "http://localhost:4004"
export const PRIVATE_CLOUD_URL = "https://cloud.privatefolio.app"

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
