// /* eslint-disable sort-keys-fix/sort-keys-fix */
import { proxy } from "comlink"
import { mergeTransactions } from "src/utils/integrations/etherscan-utils"
import { noop } from "src/utils/utils"

import { EtherscanTransaction, Transaction } from "../../interfaces"
import { ProgressCallback } from "../../stores/task-store"
import { getAccount } from "../database"
import { validateOperation } from "../database-utils"

const _filterOrder: (keyof Transaction)[] = [
  "platform",
  "wallet",
  "type",
  "outgoingAsset",
  "incomingAsset",
  "feeAsset",
]
const _filterOrderBySpecificity: (keyof Transaction)[] = [
  "outgoingAsset",
  "incomingAsset",
  "feeAsset",
  "type",
  "wallet",
  "platform",
]

export async function indexTransactions(progress: ProgressCallback, accountName: string) {
  const account = getAccount(accountName)
  progress([60, "Transactions: cleaning up stale indexes"])
  await account.transactionsDB.viewCleanup()
  progress([70, "Transactions: updating index for 'timestamp'"])
  await account.transactionsDB.createIndex({
    index: {
      fields: ["timestamp"],
      name: "timestamp",
    },
  })
  progress([75, "Transactions: updating index for 'platform'"])
  await account.transactionsDB.createIndex({
    index: {
      fields: [
        "platform",
        "timestamp",
        "wallet",
        "type",
        "outgoingAsset",
        "incomingAsset",
        "feeAsset",
      ], // MUST respect the order in _filterOrder
      name: "platform",
    },
  })
  progress([80, "Transactions: updating index for 'wallet'"])
  await account.transactionsDB.createIndex({
    index: {
      fields: [
        "wallet",
        "timestamp",
        "platform",
        "type",
        "outgoingAsset",
        "incomingAsset",
        "feeAsset",
      ], // MUST respect the order in _filterOrder
      name: "wallet",
    },
  })
  progress([85, "Transactions: updating index for 'type'"])
  await account.transactionsDB.createIndex({
    index: {
      fields: [
        "type",
        "timestamp",
        "platform",
        "wallet",
        "outgoingAsset",
        "incomingAsset",
        "feeAsset",
      ], // MUST respect the order in _filterOrder
      name: "type",
    },
  })
  progress([90, "Transactions: updating index for 'outgoingAsset'"])
  await account.transactionsDB.createIndex({
    index: {
      fields: [
        "outgoingAsset",
        "timestamp",
        "platform",
        "wallet",
        "type",
        "incomingAsset",
        "feeAsset",
      ], // MUST respect the order in _filterOrder
      name: "outgoingAsset",
    },
  })
  progress([95, "Transactions: updating index for 'incomingAsset'"])
  await account.transactionsDB.createIndex({
    index: {
      fields: [
        "incomingAsset",
        "timestamp",
        "platform",
        "wallet",
        "type",
        "outgoingAsset",
        "feeAsset",
      ], // MUST respect the order in _filterOrder
      name: "incomingAsset",
    },
  })
  progress([99, "Transactions: updating index for 'incomingAsset'"])
  await account.transactionsDB.createIndex({
    index: {
      fields: [
        "feeAsset",
        "timestamp",
        "platform",
        "wallet",
        "type",
        "outgoingAsset",
        "incomingAsset",
      ], // MUST respect the order in _filterOrder
      name: "feeAsset",
    },
  })
}

type FindTransactionsRequest = {
  fields?: string[]
  filters?: Partial<Record<keyof Transaction, string | number>>
  limit?: number
  /**
   * orderBy = timestamp, always
   *
   * @default "desc"
   */
  order?: "asc" | "desc"
  selectorOverrides?: PouchDB.Find.Selector
  skip?: number
}

export async function getTransaction(accountName: string, id: string) {
  const account = getAccount(accountName)
  return account.transactionsDB.get(id)
}

export async function findTransactions(request: FindTransactionsRequest = {}, accountName: string) {
  const account = getAccount(accountName)
  const { indexes } = await account.transactionsDB.getIndexes()
  if (indexes.length === 1) {
    // await indexTransactions(console.log, accountName)
    await indexTransactions(noop, accountName)
  }

  const { filters = {}, limit, skip, order = "desc", fields, selectorOverrides = {} } = request

  // Algorithm to help PouchDB find the best index to use
  const preferredFilter = _filterOrderBySpecificity.find((x) => filters[x])

  const selector: PouchDB.Find.Selector = !preferredFilter
    ? { timestamp: { $exists: true } }
    : {
        [preferredFilter]: filters[preferredFilter],
        timestamp: { $exists: true },
      }

  if (preferredFilter) {
    _filterOrder.forEach((filter) => {
      if (filter === preferredFilter) return
      selector[filter] = filters[filter] ? filters[filter] : { $exists: true }
    })
  }

  const sort: PouchDB.Find.FindRequest<Transaction>["sort"] = !preferredFilter
    ? [{ timestamp: order }]
    : [{ [preferredFilter]: order }, { timestamp: order }]

  const _req: PouchDB.Find.FindRequest<Transaction> = {
    fields,
    limit,
    selector: {
      ...selector,
      ...selectorOverrides,
    },
    skip,
    sort,
  }
  // console.log("📜 LOG > findTransactions > _req:", _req)
  // const explain = await (account.transactionsDB as any).explain(_req)
  // console.log("📜 LOG > findTransactions > explain:", explain.index)

  //
  const { docs, warning } = await account.transactionsDB.find(_req)
  if (warning) console.warn("findTransactions", warning)
  return docs as Transaction[]
}

export async function countTransactions(accountName: string) {
  const account = getAccount(accountName)
  const indexes = await account.transactionsDB.allDocs({
    // Prefix search
    // https://pouchdb.com/api.html#batch_fetch
    endkey: `_design\ufff0`,

    include_docs: false,
    startkey: "_design",
  })
  const result = await account.transactionsDB.allDocs({ include_docs: false, limit: 1 })
  return result.total_rows - indexes.rows.length
}

export function subscribeToTransactions(callback: () => void, accountName: string) {
  const account = getAccount(accountName)
  const changesSub = account.transactionsDB
    .changes({
      live: true,
      since: "now",
    })
    .on("change", callback)

  return proxy(() => {
    try {
      changesSub.cancel()
    } catch {}
  })
}

export async function autoMergeTransactions(
  accountName: string,
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  const account = getAccount(accountName)
  progress([0, "Fetching all transactions"])
  const transactions = await findTransactions({}, accountName)

  const ethereumTransactions = transactions.filter(
    (tx) => tx.platform === "ethereum"
  ) as EtherscanTransaction[]

  if (signal?.aborted) {
    throw new Error(signal.reason)
  }
  progress([25, `Processing ${ethereumTransactions.length} Ethereum transactions`])
  const { merged, deduplicated } = mergeTransactions(ethereumTransactions)
  //

  if (signal?.aborted) {
    throw new Error(signal.reason)
  }
  progress([50, `Saving ${merged.length} merged transactions`])
  const mergedUpdates = await account.transactionsDB.bulkDocs(merged)
  validateOperation(mergedUpdates)
  //

  if (signal?.aborted) {
    throw new Error(signal.reason)
  }
  progress([75, `Deleting ${deduplicated.length} deduplicated transactions`])
  const deduplicatedUpdates = await account.transactionsDB.bulkDocs(
    deduplicated.map((tx) => ({ _deleted: true, _id: tx._id, _rev: tx._rev } as never))
  )
  validateOperation(deduplicatedUpdates)
  //
  // TODO fix audit log txId

  progress([100, "Done"])
}

export async function updateTransaction(
  accountName: string,
  id: string,
  update: Partial<Transaction>
) {
  const account = getAccount(accountName)
  const existing = await account.transactionsDB.get(id)
  const newValue = { ...existing, ...update }
  const dbUpdate = await account.transactionsDB.put(newValue)
  validateOperation([dbUpdate])
}
