import { CoingeckoMetadataFull } from "src/interfaces"

export const COINGECKO_BASE_API = "https://api.coingecko.com/api/v3"

export async function getFullMetadata(coingeckoId: string): Promise<CoingeckoMetadataFull> {
  const params = new URLSearchParams({
    community_data: "true",
    developer_data: "true",
    localization: "false",
    market_data: "true",
    tickers: "true",
  })

  const url = `${COINGECKO_BASE_API}/coins/${coingeckoId}?${params}`

  try {
    const response = await fetch(url)
    const result = await response.json()

    if ("error" in result) {
      // coin not found
      throw new Error(result.error as string)
    }

    const meta = result as unknown as CoingeckoMetadataFull

    if (meta.detail_platforms) {
      // filter out empty values
      meta.detail_platforms = Object.fromEntries(
        Object.entries(meta.detail_platforms).filter(([_, v]) => v.contract_address !== "")
      )
    }

    return meta
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      // safely assume its a cors error due to rate limit
      throw new Error("429: Rate limited")
    }
    // console.error(error)
    throw error
  }
}
