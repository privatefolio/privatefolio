export const GITHUB_CI = process.env.GITHUB_CI === "true"
export const APP_VERSION = extractVersion(process.env.APP_VERSION)

function extractVersion(version: string) {
  try {
    const raw = version.split("\n")[0]

    if (raw.startsWith("{")) {
      const json = JSON.parse(version)
      return json[Object.keys(json)[0]]
    }

    return raw.replaceAll('"', "").replaceAll("'", "")
  } catch {
    return "unknown"
  }
}
