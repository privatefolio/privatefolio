import { DataPlatform, Extension, SecTicker } from "../../interfaces"
import { PlatformPrefix } from "../../settings/config"

export const US_SEC_PLATFORM_ID = `${PlatformPrefix.Gov}us-sec`
export const US_SEC_EXTENSION_ID = `${US_SEC_PLATFORM_ID}-metadata`

const LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/1/1c/Seal_of_the_United_States_Securities_and_Exchange_Commission.svg"

export const US_SEC_PLATFORM: DataPlatform = {
  extensionsIds: [US_SEC_EXTENSION_ID],
  id: US_SEC_PLATFORM_ID,
  image: LOGO_URL,
  name: "US SEC",
  supported: true,
  url: "https://sec.gov",
}

export const US_SEC_META_EXTENSION: Extension = {
  authorGithub: "privatefolio",
  description: "Get US company data directly from the Securities and Exchange Commission.",
  extensionLogoUrl: LOGO_URL,
  extensionName: "US SEC",
  extensionType: "metadata",
  extensionVersion: "1.0.0",
  githubUrl: "https://github.com/privatefolio/privatefolio",
  id: US_SEC_EXTENSION_ID,
  platformIds: [US_SEC_PLATFORM.id],
  publishedAt: new Date("2025-09-26").getTime(),
  sources: [
    {
      tags: ["api"],
      url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/metadata/us-sec-api.ts",
    },
  ],
  updatedAt: new Date("2025-09-26").getTime(),
}

export async function getSecTickers() {
  const url = `https://www.sec.gov/files/company_tickers.json`
  const req = await fetch(url, {
    headers: {
      "User-Agent": "Privatefolio/2.0 (hello@danielconstantin.net)",
    },
  })
  const data = (await req.json()) as Record<string, SecTicker>
  return data
}
