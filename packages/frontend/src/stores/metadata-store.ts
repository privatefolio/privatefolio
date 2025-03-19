import { atom, keepMount, map } from "nanostores"
import { getAssetTicker } from "src/utils/assets-utils"
import { logAtoms } from "src/utils/browser-utils"

import { Asset, FilterOptionsMap, PlatformId, TRANSACTIONS_TYPES } from "../interfaces"
import { PLATFORMS_META } from "../settings"
import { $rpc } from "../workers/remotes"
import { $activeAccount } from "./account-store"

export type FilterKey = keyof FilterOptionsMap
export const $filterOptionsMap = map<FilterOptionsMap>()

export const $assetMap = map<Record<string, Asset>>({})
export const $addressBook = map<Record<string, string>>({})
export const $tags = map<Record<string, string>>({})

export const $inMemoryDataQueryTime = atom<number | null>(null)

keepMount($assetMap)
keepMount($filterOptionsMap)
keepMount($addressBook)

logAtoms({ $addressBook, $assetMap, $filterOptionsMap })

export async function fetchInMemoryData() {
  const accountName = $activeAccount.get()

  const start = Date.now()
  const [assets, platform, wallet, operation, addressBook, tags] = await Promise.all([
    $rpc.get().getAssets(accountName),
    $rpc.get().getPlatforms(accountName),
    $rpc.get().getWallets(accountName),
    $rpc.get().getOperations(accountName),
    $rpc.get().getValue(accountName, "address_book", "{}"),
    $rpc.get().getTags(accountName),
  ])

  $inMemoryDataQueryTime.set(Date.now() - start)

  const assetsMap: Record<string, Asset> = assets.reduce((acc, asset) => {
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

  const map: FilterOptionsMap = {
    assetId: assetIds,
    exchangeType: ["DEX", "CEX"],
    feeAsset: assetIds,
    incomingAsset: assetIds,
    operation,
    outgoingAsset: assetIds,
    platform,
    tags: tagIds,
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
  exchangeType: "Exchange Type",
  feeAsset: "Fee Asset",
  id: "Id",
  incomingAsset: "Incoming Asset",
  operation: "Operation",
  outgoingAsset: "Outgoing Asset",
  platform: "Platform",
  tags: "Tags",
  tradeId: "Trade Id",
  txHash: "Tx Hash",
  txId: "Transaction Id",
  type: "Type",
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

  if (value in PLATFORMS_META) {
    return PLATFORMS_META[value as PlatformId].name
  }

  if (typeof value === "number" || parseInt(value) in $tags.get()) {
    return $tags.get()[value]
  }

  if (value.includes(":")) {
    return getAssetTicker(value)
  }

  if (value in $addressBook.get()) {
    return $addressBook.get()[value]
  }

  return value
}
