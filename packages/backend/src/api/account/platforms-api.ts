import { access, mkdir, readFile, writeFile } from "fs/promises"
import { customDataPlatforms, customExchanges } from "src/settings/platforms"
import { CACHE_LOCATION, PlatformPrefix } from "src/settings/settings"
import { isBlockchain, isExchange } from "src/utils/utils"

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
import { getMyPlatformIds } from "./audit-logs-api"
import { getExtensions } from "./extensions-api"
import { enqueueTask } from "./server-tasks-api"

let exchanges: Exchange[] = []
let blockchains: Blockchain[] = []

export async function getExchanges(): Promise<Exchange[]> {
  if (exchanges.length > 0) {
    return exchanges
  }

  try {
    await access(`${CACHE_LOCATION}/exchanges/all.json`)
    const data = await readFile(`${CACHE_LOCATION}/exchanges/all.json`, "utf8")
    const list: Exchange[] = JSON.parse(data).map(
      (exchange: CoingeckoExchange) =>
        ({
          coingeckoTrustRank: exchange.trust_score_rank,
          coingeckoTrustScore: exchange.trust_score ?? 0,
          country: exchange.country,
          id: `${PlatformPrefix.Exchange}${exchange.id}`,
          image: exchange.image,
          name: exchange.name,
          url: exchange.url,
          year: exchange.year_established,
        }) as Exchange
    )
    exchanges = [...list, ...customExchanges]
    list.sort((a, b) => (a.coingeckoTrustRank ?? Infinity) - (b.coingeckoTrustRank ?? Infinity))

    const extensions = await getExtensions()
    exchanges = exchanges.map((exchange) => {
      const extensionsIds = extensions
        .filter((extension) => extension.platformIds?.includes(exchange.id))
        .map((extension) => extension.id)
      const supported = extensionsIds.length > 0
      return { ...exchange, extensionsIds, supported }
    })

    return exchanges
  } catch {
    return customExchanges
  }
}

export async function getBlockchains(): Promise<Blockchain[]> {
  if (blockchains.length > 0) {
    return blockchains
  }

  try {
    await access(`${CACHE_LOCATION}/asset-platforms/all.json`)
    const data = await readFile(`${CACHE_LOCATION}/asset-platforms/all.json`, "utf8")
    const list: Blockchain[] = JSON.parse(data).map(
      (platform: CoingeckoAssetPlatform) =>
        ({
          chainId: platform.chain_identifier,
          id: `${PlatformPrefix.Chain}${platform.id}`,
          image: platform.image,
          name: platform.name,
          nativeCoinId: platform.native_coin_id,
        }) as Blockchain
    )
    list.sort((a, b) => (a.chainId ?? Infinity) - (b.chainId ?? Infinity))
    blockchains = list

    const extensions = await getExtensions()
    blockchains = blockchains.map((blockchain) => {
      const extensionsIds = extensions
        .filter((extension) => extension.platformIds?.includes(blockchain.id))
        .map((extension) => extension.id)
      const supported = extensionsIds.length > 0

      return { ...blockchain, extensionsIds, supported }
    })

    return blockchains
  } catch {
    return []
  }
}

async function refetchBlockchains() {
  const data = await getCoingeckoAssetPlatforms()
  console.log(`Coingecko blockchains fetched.`)
  await mkdir(`${CACHE_LOCATION}/asset-platforms`, { recursive: true })
  await writeFile(`${CACHE_LOCATION}/asset-platforms/all.json`, JSON.stringify(data, null, 2))
  blockchains = []
  return await getBlockchains()
}

async function refetchExchanges() {
  const data = await getCoingeckoExchanges()
  console.log(`Coingecko exchanges fetched.`)
  await mkdir(`${CACHE_LOCATION}/exchanges`, { recursive: true })
  await writeFile(`${CACHE_LOCATION}/exchanges/all.json`, JSON.stringify(data, null, 2))
  exchanges = []
  return await getExchanges()
}

export function enqueueRefetchPlatforms(
  accountName: string,
  trigger: TaskTrigger,
  onlyIfNeeded = false
) {
  return enqueueTask(accountName, {
    description: "Refetching platforms.",
    function: async (progress) => {
      const blockchains = await getBlockchains()
      const exchanges = await getExchanges()
      if (blockchains.length !== 0 && exchanges.length !== 0 && onlyIfNeeded) {
        await progress([
          undefined,
          `Coingecko platforms already exist: ${blockchains.length} blockchains, ${exchanges.length} exchanges.`,
        ])
        return
      }
      await Promise.all([
        (async function first() {
          const data = await refetchBlockchains()
          await progress([undefined, `Refetched ${data.length} blockchains`])
        })(),
        (async function second() {
          const data = await refetchExchanges()
          await progress([undefined, `Refetched ${data.length} exchanges`])
        })(),
      ])
    },
    name: "Refetch platforms",
    priority: TaskPriority.High,
    trigger,
  })
}

export async function findPlatforms(
  accountName: string,
  query: string,
  limit = 5,
  strict = false,
  searchSet: "coingecko" | "my-platforms" = "coingecko"
): Promise<FindPlatformsResult> {
  const normalizedQuery = query.toLowerCase().trim()

  let blockchains: Blockchain[] = []
  let exchanges: Exchange[] = []

  if (searchSet === "coingecko") {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;[blockchains, exchanges] = await Promise.all([getBlockchains(), getExchanges()])
  } else {
    const myPlatforms = await getMyPlatforms(accountName)
    blockchains = myPlatforms.filter((platform) => isBlockchain(platform))
    exchanges = myPlatforms.filter((platform) => isExchange(platform))
  }

  const matchingBlockchains: Blockchain[] = []
  for (const blockchain of blockchains) {
    if (matchingBlockchains.length >= limit) {
      break
    }
    if (
      !normalizedQuery ||
      blockchain.name.toLowerCase().includes(normalizedQuery) ||
      blockchain.id.toLowerCase().includes(normalizedQuery)
    ) {
      matchingBlockchains.push(blockchain)
    }
    if (strict) continue

    if (blockchain.chainId?.toString().includes(normalizedQuery)) {
      matchingBlockchains.push(blockchain)
    }
  }

  const matchingExchanges: Exchange[] = []
  for (const exchange of exchanges) {
    if (matchingExchanges.length >= limit) {
      break
    }
    if (
      !normalizedQuery ||
      exchange.name.toLowerCase().includes(normalizedQuery) ||
      exchange.id.toLowerCase().includes(normalizedQuery)
    ) {
      matchingExchanges.push(exchange)
    }
    if (strict) continue
    if (exchange.country?.toLowerCase().includes(normalizedQuery)) {
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
    exchanges.find((exchange) => exchange.id === id) ||
    customDataPlatforms.find((platform) => platform.id === id)
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

export async function getAllPlatforms() {
  const blockchains = await getBlockchains()
  const exchanges = await getExchanges()
  const platforms = [...blockchains, ...exchanges, ...customDataPlatforms]
  platforms.sort((a, b) => (b.extensionsIds?.length ?? 0) - (a.extensionsIds?.length ?? 0))
  return platforms
}

export async function getMyPlatforms(accountName: string) {
  const platformIds = await getMyPlatformIds(accountName)
  return getPlatformsByIds(platformIds)
}

export async function refetchPlatformsIfNeeded() {
  console.log(`Coingecko platforms checking...`)
  const blockchains = await getBlockchains()
  const exchanges = await getExchanges()
  if (blockchains.length === 0 || exchanges.length === 0) {
    console.log(`Coingecko platforms fetching...`)
    return await Promise.all([refetchBlockchains(), refetchExchanges()])
  }
  console.log(
    `Coingecko platforms already exist. ${blockchains.length} blockchains, ${exchanges.length} exchanges.`
  )
  return { blockchains, exchanges }
}
