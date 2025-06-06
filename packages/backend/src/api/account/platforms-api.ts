import { mkdir, readFile, writeFile } from "fs/promises"
import { CACHE_LOCATION } from "src/settings/settings"

import {
  getCoingeckoAssetPlatforms,
  getCoingeckoExchanges,
} from "../../extensions/metadata/coingecko/coingecko-asset-cache"
import {
  CoingeckoAssetPlatform,
  CoingeckoExchange,
} from "../../extensions/metadata/coingecko/coingecko-interfaces"
import {
  Blockchain,
  Exchange,
  FindPlatformsResult,
  Platform,
  TaskPriority,
  TaskTrigger,
} from "../../interfaces"
import { enqueueTask } from "./server-tasks-api"

const customExchanges: Exchange[] = [
  {
    coingeckoTrustScore: 0,
    id: "coinmama",
    image: "$STATIC_ASSETS/extensions/coinmama.png",
    name: "Coinmama",
    url: "https://www.coinmama.com",
    year: 2013,
  },
]

let exchanges: Exchange[] = []
let blockchains: Blockchain[] = []

export async function getExchanges(): Promise<Exchange[]> {
  if (exchanges.length > 0) {
    return exchanges
  }

  try {
    const data = await readFile(`${CACHE_LOCATION}/exchanges/all.json`, "utf8")
    const list: Exchange[] = JSON.parse(data).map(
      (exchange: CoingeckoExchange) =>
        ({
          coingeckoTrustRank: exchange.trust_score_rank,
          coingeckoTrustScore: exchange.trust_score ?? 0,
          country: exchange.country,
          id: exchange.id,
          image: exchange.image,
          name: exchange.name,
          url: exchange.url,
          year: exchange.year_established,
        }) as Exchange
    )
    list.sort((a, b) => (a.coingeckoTrustRank ?? Infinity) - (b.coingeckoTrustRank ?? Infinity))
    exchanges = list
    return [...exchanges, ...customExchanges]
  } catch (error) {
    console.error(error)
    return customExchanges
  }
}

export async function getBlockchains(): Promise<Blockchain[]> {
  if (blockchains.length > 0) {
    return blockchains
  }

  try {
    const data = await readFile(`${CACHE_LOCATION}/asset-platforms/all.json`, "utf8")
    const list: Blockchain[] = JSON.parse(data).map(
      (platform: CoingeckoAssetPlatform) =>
        ({
          chainId: platform.chain_identifier,
          id: platform.id,
          image: platform.image,
          name: platform.name,
          nativeCoinId: platform.native_coin_id,
        }) as Blockchain
    )
    list.sort((a, b) => (a.chainId ?? Infinity) - (b.chainId ?? Infinity))
    blockchains = list
    return blockchains
  } catch (error) {
    console.error(error)
    return []
  }
}

export function enqueueRefetchPlatforms(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Refetching asset platforms.",
    function: async (progress) => {
      await Promise.all([
        (async function refetchPlatforms() {
          const data = await getCoingeckoAssetPlatforms()
          await mkdir(`${CACHE_LOCATION}/asset-platforms`, { recursive: true })
          await writeFile(
            `${CACHE_LOCATION}/asset-platforms/all.json`,
            JSON.stringify(data, null, 2)
          )
          blockchains = []
          exchanges = []
          await progress([undefined, `Refetched ${data.length} blockchains`])
        })(),
        (async function refetchExchanges() {
          const data = await getCoingeckoExchanges()
          await mkdir(`${CACHE_LOCATION}/exchanges`, { recursive: true })
          await writeFile(`${CACHE_LOCATION}/exchanges/all.json`, JSON.stringify(data, null, 2))
          await progress([undefined, `Refetched ${data.length} exchanges`])
        })(),
      ])
    },
    name: "Refetch asset platforms",
    priority: TaskPriority.MediumHigh,
    trigger,
  })
}

export async function findPlatforms(query: string, limit = 5): Promise<FindPlatformsResult> {
  const normalizedQuery = query.toLowerCase().trim()

  if (!normalizedQuery) {
    return { blockchains: [], exchanges: [] }
  }

  const [blockchains, exchanges] = await Promise.all([getBlockchains(), getExchanges()])

  const matchingBlockchains: Blockchain[] = []
  for (const blockchain of blockchains) {
    if (matchingBlockchains.length >= limit) {
      break
    }
    if (
      blockchain.name.toLowerCase().includes(normalizedQuery) ||
      blockchain.id.toLowerCase().includes(normalizedQuery) ||
      blockchain.chainId?.toString().includes(normalizedQuery)
    ) {
      matchingBlockchains.push(blockchain)
    }
  }

  const matchingExchanges: Exchange[] = []
  for (const exchange of exchanges) {
    if (matchingExchanges.length >= limit) {
      break
    }
    if (
      exchange.name.toLowerCase().includes(normalizedQuery) ||
      exchange.id.toLowerCase().includes(normalizedQuery) ||
      exchange.country?.toLowerCase().includes(normalizedQuery)
    ) {
      matchingExchanges.push(exchange)
    }
  }

  return {
    blockchains: matchingBlockchains,
    exchanges: matchingExchanges,
  }
}

export async function getBlockchainById(id: string): Promise<Blockchain | undefined> {
  const blockchains = await getBlockchains()
  return blockchains.find((blockchain) => blockchain.id === id)
}

export async function getExchangeById(id: string): Promise<Exchange | undefined> {
  const exchanges = await getExchanges()
  return exchanges.find((exchange) => exchange.id === id)
}

export async function getPlatform(id: string): Promise<Platform | undefined> {
  const blockchains = await getBlockchains()
  const exchanges = await getExchanges()
  return (
    blockchains.find((blockchain) => blockchain.id === id) ||
    exchanges.find((exchange) => exchange.id === id)
  )
}

export async function getPlatformsByIds(ids: string[]): Promise<Platform[]> {
  const blockchains = await getBlockchains()
  const exchanges = await getExchanges()
  return [
    ...blockchains.filter((blockchain) => ids.includes(blockchain.id)),
    ...exchanges.filter((exchange) => ids.includes(exchange.id)),
  ]
}
