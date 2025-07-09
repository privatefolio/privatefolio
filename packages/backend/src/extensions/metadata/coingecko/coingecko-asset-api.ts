import { CoingeckoMetadataFull } from "src/interfaces"

export const COINGECKO_BASE_API = "https://api.coingecko.com/api/v3"

// Helper function for delayed execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getFullMetadata(
  coingeckoId: string,
  retries = 5,
  delay = 15000
): Promise<CoingeckoMetadataFull> {
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

    // Coingecko uses 429 for rate limiting
    if (response.status === 429) {
      throw new Error("429: Rate limited")
    }

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
    // Stop retrying if only 1 retry is left
    if (retries <= 1) {
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        // safely assume its a cors error due to rate limit
        throw new Error("429: Rate limited by CORS or network issue")
      }
      throw error
    }

    console.log(
      `Failed to fetch metadata for ${coingeckoId}. Retrying in ${delay / 1000}s... (${
        retries - 1
      } retries left)`
    )

    // Wait for the specified delay
    await sleep(delay)

    // Retry the request with one less retry and double the delay for next time
    return getFullMetadata(coingeckoId, retries - 1, delay * 2)
  }
}
