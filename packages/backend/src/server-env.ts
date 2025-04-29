export const GITHUB_CI = process.env.GITHUB_CI === "true"
export const APP_VERSION = extractVersion(process.env.APP_VERSION)

function extractVersion(version: string) {
  try {
    const raw = version.split("\n")[0]
    return `v${raw.replaceAll('"', "").replaceAll("'", "")}`
  } catch {
    return "unknown"
  }
}
