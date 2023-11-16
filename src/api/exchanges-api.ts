import { Exchange } from "../interfaces"
import { EXCHANGE_FILES_LOCATION, EXCHANGE_PAGES } from "../settings"

export async function findExchanges(nameMap: Record<string, boolean>) {
  const map: Record<string, Exchange> = {}

  for (let page = 1; page <= EXCHANGE_PAGES; page++) {
    // console.log(`Exchanges: Fetching page ${page}`)
    const response = await fetch(`${EXCHANGE_FILES_LOCATION}/page-${page}.json`)
    const exchanges: Exchange[] = await response.json()

    for (const exchange of exchanges) {
      if (nameMap[exchange.name]) {
        map[exchange.name] = exchange
      }
    }
    // TODO: stop if completed
    // console.log(`Exchanges: Parsed page ${page}`)
  }

  return map
}