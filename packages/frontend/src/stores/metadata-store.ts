import { atom, keepMount, map } from "nanostores"
import { getAssetTicker } from "src/utils/assets-utils"
import { logAtoms } from "src/utils/browser-utils"

import { FilterOptionsMap, MyAsset, Platform, TRADE_TYPES, TRANSACTIONS_TYPES } from "../interfaces"
import { RPC } from "../workers/remotes"

export type FilterKey = keyof FilterOptionsMap
export const $filterOptionsMap = map<FilterOptionsMap>()

export const $assetMap = map<Record<string, MyAsset>>({})
export const $addressBook = map<Record<string, string>>({})
export const $tags = map<Record<string, string>>({})
export const $myPlatforms = map<Record<string, Platform>>({})

export const $inMemoryDataQueryTime = atom<number | null>(null)

keepMount($assetMap)
keepMount($filterOptionsMap)
keepMount($addressBook)

logAtoms({ $addressBook, $assetMap, $filterOptionsMap, $myPlatforms })

export async function fetchInMemoryData(rpc: RPC, accountName: string) {
  const start = Date.now()
  const [assets, platformIds, platforms, wallet, operation, addressBook, tags, triggers] =
    await Promise.all([
      rpc.getMyAssets(accountName),
      rpc.getMyPlatformIds(accountName),
      rpc.getMyPlatforms(accountName),
      rpc.getWallets(accountName),
      rpc.getOperations(accountName),
      rpc.getValue(accountName, "address_book", "{}"),
      rpc.getTags(accountName),
      rpc.getTriggers(accountName),
    ])

  $inMemoryDataQueryTime.set(Date.now() - start)

  const assetsMap: Record<string, MyAsset> = assets.reduce((acc, asset) => {
    acc[asset.id] = asset
    return acc
  }, {})
  $assetMap.set(assetsMap)

  const assetIds = assets
    .map((x) => x.id)
    .sort((a, b) => {
      const tickerA = getAssetTicker(a)
      const tickerB = getAssetTicker(b)
      return tickerA.localeCompare(tickerB)
    })

  const tagIds: number[] = []
  const tagsMap = tags.reduce((map, tag) => {
    map[tag.id] = tag.name
    tagIds.push(tag.id)
    return map
  }, {})
  $tags.set(tagsMap)

  const platformsMap: Record<string, Platform> = platforms.reduce((acc, platform) => {
    acc[platform.id] = platform
    return acc
  }, {})
  $myPlatforms.set(platformsMap)

  const map: FilterOptionsMap = {
    assetId: assetIds,
    createdBy: ["user", "system"],
    exchangeType: ["DEX", "CEX"],
    extensionType: ["file-import", "connection", "price-api", "metadata"],
    feeAsset: assetIds,
    incomingAsset: assetIds,
    operation,
    outgoingAsset: assetIds,
    platform: platformIds,
    tags: tagIds,
    tradeType: TRADE_TYPES,
    trigger: triggers,
    type: TRANSACTIONS_TYPES,
    wallet,
  }
  $filterOptionsMap.set(map)

  $addressBook.set(JSON.parse(addressBook as string))

  console.log("Fetched in-memory database")
}

type DirectFilterKey = "id" | "txId" | "txHash" | "tradeId"

// TODO0 this union type can be improved
export const FILTER_LABEL_MAP: Record<FilterKey | DirectFilterKey, string> = {
  assetId: "Asset",
  createdBy: "Created By",
  exchangeType: "Exchange Type",
  extensionType: "Type",
  feeAsset: "Fee Asset",
  id: "Id",
  incomingAsset: "Incoming Asset",
  operation: "Operation",
  outgoingAsset: "Outgoing Asset",
  platform: "Platform",
  tags: "Tags",
  tradeId: "Trade Id",
  tradeType: "Trade Type",
  trigger: "Trigger",
  txHash: "Tx Hash",
  txId: "Transaction Id",
  type: "Transaction Type",
  wallet: "Wallet",
}

export function getAddressBookEntry(value: string) {
  if (value in $addressBook.get()) {
    return $addressBook.get()[value]
  }

  return value
}

export function getFilterValueLabel(value: string | number | undefined) {
  if (value === undefined) return ""

  if (value in $myPlatforms.get()) {
    return $myPlatforms.get()[value].name
  }

  if (typeof value === "number" || parseInt(value) in $tags.get()) {
    return $tags.get()[value]
  }

  if (value.includes(":")) {
    return getAssetTicker(value)
  }

  if (value === "user") return "User"
  if (value === "system") return "System"
  if (value === "side-effect") return "Side-Effect"
  if (value === "cron") return "Cron"
  if (value === "file-import") return "File Import"
  if (value === "connection") return "Connection"
  if (value === "price-api") return "Price API"
  if (value === "metadata") return "Metadata"

  if (value in $addressBook.get()) {
    return $addressBook.get()[value]
  }

  return value
}
