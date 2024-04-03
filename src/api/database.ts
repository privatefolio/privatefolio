import PouchDB from "pouchdb"
import PouchDBFind from "pouchdb-find"

// import replicationStream from "pouchdb-replication-stream"
import {
  Asset,
  AuditLog,
  BalanceMap,
  Connection,
  FileImport,
  Networth,
  SavedPrice,
  Transaction,
} from "../interfaces"

if (typeof window !== "undefined") {
  throw new Error(
    "Database should not be initialized in the browser, only in the web worker or node environment"
  )
}

const testEnvironment = process.env.NODE_ENV === "test"

if (testEnvironment) {
  const { default: PouchDBMemory } = await import("pouchdb-adapter-memory")
  PouchDB.plugin(PouchDBMemory)
}

// try {
//   PouchDB.replicate("file-imports", "http://localhost:5984/file-imports", { live: true })
//   PouchDB.replicate("audit-logs", "http://localhost:5984/audit-logs", { live: true })
// } catch {
//   console.log("Error replicating database")
// }

// declare module "pouchdb-core" {
//   interface Database<Content extends {} = {}> {
//     explain(query: any): Promise<any>
//   }
// }
PouchDB.plugin(PouchDBFind)
// console.log("🚀 ~ replicationStream:", replicationStream)
// PouchDB.plugin(replicationStream.plugin)

export const Pouch = PouchDB

export const defaultDbOptions: PouchDB.Configuration.LocalDatabaseConfiguration = {
  adapter: testEnvironment ? "memory" : undefined,
  auto_compaction: true,
  revs_limit: 1,
}

// Account database
function createAccount(accountName: string) {
  const assetsDB = new PouchDB<Asset>(`${accountName}/assets`, defaultDbOptions)
  const connectionsDB = new PouchDB<Connection>(`${accountName}/connections`, defaultDbOptions)
  const fileImportsDB = new PouchDB<FileImport>(`${accountName}/file-imports`, defaultDbOptions)
  const auditLogsDB = new PouchDB<AuditLog>(`${accountName}/audit-logs`, defaultDbOptions)
  const transactionsDB = new PouchDB<Transaction>(`${accountName}/transactions`, defaultDbOptions)
  const balancesDB = new PouchDB<BalanceMap>(`${accountName}/balances`, defaultDbOptions)
  const networthDB = new PouchDB<Networth>(`${accountName}/networth`, defaultDbOptions)
  const keyValueDB = new PouchDB<{ value: unknown }>(`${accountName}/key-value`, defaultDbOptions)

  // transactionsDB.on("indexing", function (event) {
  //   console.log("Indexing", event)
  // })
  // auditLogsDB.on("indexing", function (event) {
  //   console.log("Indexing", event)
  // })

  return {
    assetsDB,
    auditLogsDB,
    balancesDB,
    connectionsDB,
    fileImportsDB,
    keyValueDB,
    name: accountName,
    networthDB,
    transactionsDB,
  }
}

export type AccountDatabase = ReturnType<typeof createAccount>

const accounts: AccountDatabase[] = []

export function getAccount(accountName: string) {
  const existing = accounts.find((x) => x.name === accountName)

  if (!existing) {
    const account = createAccount(accountName)
    accounts.push(account)
    return account
  }

  return existing
}

export async function deleteAccount(accountName: string) {
  const account = getAccount(accountName)
  //
  const {
    assetsDB,
    auditLogsDB,
    balancesDB,
    connectionsDB,
    fileImportsDB,
    keyValueDB,
    networthDB,
    transactionsDB,
  } = account
  await assetsDB.destroy()
  await connectionsDB.destroy()
  await fileImportsDB.destroy()
  await auditLogsDB.destroy()
  await transactionsDB.destroy()
  await balancesDB.destroy()
  await networthDB.destroy()
  await keyValueDB.destroy()
  //
  accounts.splice(accounts.indexOf(account), 1)
}

export async function resetAccount(accountName: string) {
  await deleteAccount(accountName)
  getAccount(accountName)
}

// Core database
export const core = {
  dailyPricesDB: new PouchDB<SavedPrice>(`core/daily-prices`, defaultDbOptions),
  sharedKeyValueDB: new PouchDB<{ value: unknown }>(`core/key-value`, defaultDbOptions),
}

export function initCoreDatabase() {
  core.dailyPricesDB = new PouchDB<SavedPrice>(`core/daily-prices`, defaultDbOptions)
  core.sharedKeyValueDB = new PouchDB<{ value: unknown }>(`core/key-value`, defaultDbOptions)
}

export async function resetCoreDatabase() {
  await core.dailyPricesDB.destroy()
  await core.sharedKeyValueDB.destroy()
  initCoreDatabase()
}

export type CoreDatabase = ReturnType<typeof initCoreDatabase>
