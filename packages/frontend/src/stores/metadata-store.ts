import { atom, keepMount, map } from "nanostores"
import { getAssetTicker } from "src/utils/assets-utils"
import { logAtoms } from "src/utils/browser-utils"

import {
  FilterOptionsMap,
  MyAsset,
  Platform,
  TaskStatus,
  TRADE_TYPES,
  TRANSACTIONS_TYPES,
} from "../interfaces"
import { RPC } from "../workers/remotes"

export type FilterKey = keyof FilterOptionsMap
export const $filterOptionsMap = map<FilterOptionsMap>()

export const $assetMap = map<Record<string, MyAsset>>({})
export const $addressBook = map<Record<string, string>>({})
export const $tags = map<Record<string, string>>({})
export const $platformMap = map<Record<string, Platform>>({})

export const $inMemoryDataQueryTime = atom<number | null>(null)

keepMount($assetMap)
keepMount($filterOptionsMap)
keepMount($addressBook)

logAtoms({ $addressBook, $assetMap, $filterOptionsMap, $platformMap })

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

  const assetMap: Record<string, MyAsset> = assets.reduce((acc, asset) => {
    acc[asset.id] = asset
    return acc
  }, {})
  $assetMap.set(assetMap)

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

  const platformMap: Record<string, Platform> = platforms.reduce((acc, platform) => {
    acc[platform.id] = platform
    return acc
  }, {})
  $platformMap.set(platformMap)

  const map: FilterOptionsMap = {
    assetId: assetIds,
    capabilities: ["web-search", "reasoning", "tools"],
    createdBy: ["user", "system"],
    exchangeType: ["DEX", "CEX"],
    extensionType: ["file-import", "connection", "price-api", "metadata"],
    family: ["openai", "perplexity", "anthropic"],
    feeAsset: assetIds,
    incomingAsset: assetIds,
    operation,
    outgoingAsset: assetIds,
    platformId: platformIds,
    status: Object.values(TaskStatus),
    tags: tagIds,
    tradeStatus: ["open", "closed"],
    tradeType: TRADE_TYPES,
    trigger: triggers,
    type: TRANSACTIONS_TYPES,
    wallet,
  }
  $filterOptionsMap.set(map)

  $addressBook.set(JSON.parse(addressBook as string))

  console.log("Fetched in-memory database")
}

type DirectFilterKey = "id" | "txId" | "txHash" | "tradeId" | "groupId"

// TODO0 this union type can be improved
export const FILTER_LABEL_MAP: Record<FilterKey | DirectFilterKey, string> = {
  assetId: "Asset",
  capabilities: "Capabilities",
  createdBy: "Created by",
  exchangeType: "Exchange type",
  extensionType: "Type",
  family: "Model family",
  feeAsset: "Fee asset",
  groupId: "Group Id",
  id: "Id",
  incomingAsset: "Incoming asset",
  operation: "Operation",
  outgoingAsset: "Outgoing asset",
  platformId: "Platform",
  status: "Task status",
  tags: "Tags",
  tradeId: "Trade Id",
  tradeStatus: "Trade status",
  tradeType: "Trade type",
  trigger: "Trigger",
  txHash: "Tx hash",
  txId: "Transaction Id",
  type: "Transaction type",
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

  if (value in $platformMap.get()) {
    return $platformMap.get()[value].name
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
  if (value === "coingecko") return "Coingecko"
  if (value === "queued") return "Queued"
  if (value === "running") return "Running"
  if (value === "completed") return "Completed"
  if (value === "aborted") return "Aborted"
  if (value === "cancelled") return "Cancelled"
  if (value === "failed") return "Failed"
  if (value === "openai") return "OpenAI"
  if (value === "perplexity") return "Perplexity"
  if (value === "anthropic") return "Anthropic"
  if (value === "web-search") return "Web search"
  if (value === "reasoning") return "Reasoning"
  if (value === "tools") return "Tools"
  if (value === "open") return "Open"
  if (value === "closed") return "Closed"
  if (value === "manual-import") return "Manual import"

  if (value in $addressBook.get()) {
    return $addressBook.get()[value]
  }

  return value
}

export async function addWalletToAddressBook(
  rpc: RPC,
  accountName: string,
  wallet: string,
  label: string
) {
  const addressBook = $addressBook.get()
  const newAddressBook = Object.assign({}, addressBook, { [wallet]: label })
  await rpc.setValue(accountName, "address_book", JSON.stringify(newAddressBook))
  $addressBook.set(newAddressBook)
}
