export const GITHUB_CI = process.env.GITHUB_CI === "true"
export const APP_VERSION = extractVersion(process.env.APP_VERSION)

function extractVersion(version: string) {
  try {
    return "v" + JSON.parse(version)["privatefolio-backend"]
  } catch {
    return "unknown"
  }
}
