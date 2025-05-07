import EventEmitter from "events"
import { access, mkdir, readdir, rm, stat, writeFile } from "fs/promises"
import { join } from "path"
import { EventCause, SubscriptionChannel, TaskPriority } from "src/interfaces"
import { DATABASES_LOCATION, LOGS_LOCATION } from "src/settings"
import { createSqliteDatabaseConnection } from "src/sqlite/sqlite"
import { isDevelopment, isTestEnvironment } from "src/utils/environment-utils"
import { sql } from "src/utils/sql-utils"
import { sleep } from "src/utils/utils"

import { getValue, setValue } from "./account/kv-api"
import { enqueueTask, upsertServerTask } from "./account/server-tasks-api"

if (typeof window !== "undefined") {
  throw new Error(
    "Database should not be initialized in the browser, only in a web worker or node environment"
  )
}

const appEventEmitter = new EventEmitter()

const IN_MEMORY_DB = ":memory:"

async function createDatabaseConnection(accountName: string, createIfNeeded = false) {
  const databaseFilePath = isTestEnvironment
    ? IN_MEMORY_DB
    : join(DATABASES_LOCATION, `${accountName}.sqlite`)

  if (databaseFilePath !== IN_MEMORY_DB) {
    // ensure the file exists
    try {
      await access(databaseFilePath)
      console.log(`[${accountName}]`, "Connecting to existing database", databaseFilePath)
    } catch {
      console.log(`[${accountName}]`, "Creating database file", databaseFilePath)
      if (!createIfNeeded) throw new Error(`Account "${accountName}" does not exist`)
      // ensure databases dir exists
      await mkdir(DATABASES_LOCATION, { recursive: true })
      await writeFile(databaseFilePath, "")
    }
  }

  const db = await createSqliteDatabaseConnection(databaseFilePath)

  const journalMode = await db.execute(`PRAGMA journal_mode;`)
  if (isDevelopment) {
    console.log(`[${accountName}]`, "SQLite journal mode:", journalMode[0][0])
  }

  return db
}

export type DatabaseConnection = Awaited<ReturnType<typeof createDatabaseConnection>>

export type BaseAccount = DatabaseConnection & {
  eventEmitter: EventEmitter
  name: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AccountExtensions {}

export interface Account extends BaseAccount, AccountExtensions {}

const accounts: Record<string, Promise<Account>> = {}

function populateFirstServerTask(accountName: string) {
  const createdAt = Date.now()
  setTimeout(() => {
    upsertServerTask(accountName, {
      completedAt: Date.now(),
      createdAt,
      description: `Initializing database for account "${accountName}".`,
      duration: Date.now() - createdAt,
      name: "Initialize database",
      priority: TaskPriority.VeryHigh,
      startedAt: createdAt,
      status: "completed",
      trigger: "system",
    })
  }, 50)
}

/**
 * Get a database connection for the given account.
 *
 * There is a 1:1 relationship between an account and a database (single-tenant).
 */
export async function getAccount(accountName: string, createIfNeeded = false): Promise<Account> {
  if (!accountName) throw new Error("Account name is required")

  if (!accounts[accountName]) {
    accounts[accountName] = (async () => {
      const db: DatabaseConnection = await createDatabaseConnection(accountName, createIfNeeded)
      const initialized = await initializeDatabaseIfNeeded(db, accountName)
      if (initialized) {
        appEventEmitter.emit(SubscriptionChannel.Accounts, EventCause.Created, accountName)
        populateFirstServerTask(accountName)
      }
      const account: BaseAccount = {
        ...db,
        eventEmitter: new EventEmitter(),
        name: accountName,
      }

      account.eventEmitter.setMaxListeners(120)

      return account as Account
    })()
  }

  return accounts[accountName]
}

export async function reconnectAccount(accountName: string) {
  const account = await getAccount(accountName)
  await account.close()
  delete accounts[accountName]
  return getAccount(accountName)
}

export async function createAccount(accountName: string) {
  await getAccount(accountName, true)
}

export async function deleteAccount(accountName: string, keepAccount = false) {
  const account = await getAccount(accountName)
  console.log(`[${accountName}]`, "Deleting database.")

  const schema = await account.execute(
    "SELECT type, name FROM sqlite_master WHERE type IN ('table', 'index', 'trigger') AND name NOT IN ('sqlite_sequence', 'sqlite_master')"
  )

  for (const row of schema) {
    const [type, name] = row
    await account.execute(`DROP ${type} IF EXISTS "${name}"`)
  }

  await account.execute("VACUUM;")

  const integrityCheck = (await account.execute("PRAGMA INTEGRITY_CHECK;"))[0][0]
  if (integrityCheck !== "ok") {
    throw new Error("Database integrity check failed")
  }

  // delete logs & database file
  await rm(join(DATABASES_LOCATION, `${accountName}.sqlite`), { force: true, recursive: true })
  await rm(join(LOGS_LOCATION, accountName), { force: true, recursive: true })

  console.log(`[${accountName}]`, "Deleted database.")

  if (!keepAccount) {
    delete accounts[accountName]
    appEventEmitter.emit(SubscriptionChannel.Accounts, EventCause.Deleted, accountName)
  }
}

/**
 * Resets an account while preserving the account object reference.
 *
 * This function:
 * 1. Clears the task queue and aborts any pending tasks
 * 2. Preserves the account reference in the accounts object
 * 3. Deletes the database file and logs (with keepAccount=true)
 * 4. Creates a new database connection
 * 5. Updates the existing account object with the new database connection
 * 6. Emits Reset events for all subscription channels
 */
export async function resetAccount(accountName: string) {
  const account = await getAccount(accountName)

  account.taskQueue = []
  account.isProcessing = false
  account.pendingTask?.abortController?.abort("reset")
  account.pendingTask = undefined

  await deleteAccount(accountName, true)

  // recreate db
  const db: DatabaseConnection = await createDatabaseConnection(accountName, true)
  await initializeDatabaseIfNeeded(db, accountName)
  populateFirstServerTask(accountName)

  Object.assign(account, db)

  for (const channelName in SubscriptionChannel) {
    account.eventEmitter.emit(SubscriptionChannel[channelName], EventCause.Reset)
  }
}

async function initializeDatabaseIfNeeded(
  account: DatabaseConnection,
  accountName: string
): Promise<boolean> {
  const tablesCount = (
    await account.execute(sql`
    SELECT COUNT(*) 
    FROM sqlite_master
    `)
  )[0][0] as number

  if (tablesCount > 0) {
    console.log(`[${accountName}]`, "Skipping database initialization.")
    return false
  }

  console.log(`[${accountName}]`, "Initializing database.")
  try {
    await account.execute(`PRAGMA journal_mode = WAL;`)
  } catch {
    console.log(`[${accountName}]`, "Failed to set journal mode to WAL")
  }

  await account.execute(sql`
CREATE TABLE file_imports (
  id VARCHAR PRIMARY KEY,
  lastModified INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  size FLOAT NOT NULL,
  timestamp TIMESTAMP,
  meta JSON
);
`)

  await account.execute(sql`
CREATE TABLE audit_logs (
  id VARCHAR PRIMARY KEY,
  assetId VARCHAR NOT NULL,
  balance VARCHAR,
  balanceN FLOAT GENERATED ALWAYS AS (CAST(balance AS REAL)) STORED,
  change VARCHAR NOT NULL,
  changeN FLOAT GENERATED ALWAYS AS (CAST(change AS REAL)) STORED,
  fileImportId VARCHAR,
  connectionId VARCHAR,
  importIndex INTEGER NOT NULL,
  operation VARCHAR NOT NULL,
  platform VARCHAR NOT NULL,
  timestamp INTEGER NOT NULL,
  txId VARCHAR,
  wallet VARCHAR NOT NULL,
  FOREIGN KEY (assetId) REFERENCES assets(id),
  FOREIGN KEY (connectionId) REFERENCES connections(id),
  FOREIGN KEY (fileImportId) REFERENCES fileImports(id),
  FOREIGN KEY (txId) REFERENCES transactions(id)
);
`)

  await account.execute(sql`
CREATE TABLE transactions (
  id VARCHAR PRIMARY KEY,
  incomingAsset VARCHAR,
  incoming VARCHAR,
  incomingN FLOAT GENERATED ALWAYS AS (CAST(incoming AS REAL)) STORED,
  feeAsset VARCHAR,
  fee VARCHAR,
  feeN FLOAT GENERATED ALWAYS AS (CAST(fee AS REAL)) STORED,
  fileImportId VARCHAR,
  connectionId VARCHAR,
  importIndex INTEGER,
  outgoingAsset VARCHAR,
  outgoing VARCHAR,
  outgoingN FLOAT GENERATED ALWAYS AS (CAST(outgoing AS REAL)) STORED,
  notes VARCHAR,
  platform VARCHAR NOT NULL,
  price VARCHAR,
  priceN FLOAT GENERATED ALWAYS AS (CAST(price AS REAL)) STORED,
  role VARCHAR,
  timestamp INTEGER NOT NULL,
  type VARCHAR NOT NULL,
  wallet VARCHAR NOT NULL,
  metadata JSON,
  FOREIGN KEY (feeAsset) REFERENCES assets(id),
  FOREIGN KEY (incomingAsset) REFERENCES assets(id),
  FOREIGN KEY (outgoingAsset) REFERENCES assets(id),
  FOREIGN KEY (connectionId) REFERENCES connections(id),
  FOREIGN KEY (fileImportId) REFERENCES fileImports(id)
);
`)

  await account.execute(sql`
CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL
);
`)

  await account.execute(sql`
CREATE TABLE audit_log_tags (
  audit_log_id VARCHAR NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (audit_log_id, tag_id),
  FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
`)

  await account.execute(sql`
CREATE TABLE transaction_tags (
  transaction_id VARCHAR NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (transaction_id, tag_id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
`)

  await account.execute(sql`
CREATE TABLE trades (
  id VARCHAR PRIMARY KEY,
  assetId VARCHAR NOT NULL,
  amount FLOAT NOT NULL,
  balance FLOAT NOT NULL,
  createdAt INTEGER NOT NULL,
  closedAt INTEGER,
  duration INTEGER,
  isOpen BOOLEAN NOT NULL DEFAULT 1,
  soldAssets JSON,
  soldAmounts JSON,
  feeAssets JSON,
  feeAmounts JSON,
  FOREIGN KEY (assetId) REFERENCES assets(id)
);
`)

  await account.execute(sql`
CREATE TABLE trade_audit_logs (
  trade_id VARCHAR NOT NULL,
  audit_log_id VARCHAR NOT NULL,
  PRIMARY KEY (trade_id, audit_log_id),
  FOREIGN KEY (trade_id) REFERENCES trades(id),
  FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id)
);
`)

  await account.execute(sql`
CREATE TABLE trade_transactions (
  trade_id VARCHAR NOT NULL,
  transaction_id VARCHAR NOT NULL,
  PRIMARY KEY (trade_id, transaction_id),
  FOREIGN KEY (trade_id) REFERENCES trades(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
`)

  await account.execute(sql`
CREATE TABLE trade_tags (
  trade_id VARCHAR NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (trade_id, tag_id),
  FOREIGN KEY (trade_id) REFERENCES trades(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
`)

  await account.execute(sql`
CREATE TABLE balances (
  timestamp INTEGER PRIMARY KEY,
  data JSON
);
`)

  await account.execute(sql`
CREATE TABLE key_value (
  key VARCHAR PRIMARY KEY,
  value JSON
);
`)

  await account.execute(sql`
CREATE TABLE daily_prices (
  id VARCHAR PRIMARY KEY NOT NULL UNIQUE,
  assetId VARCHAR NOT NULL,
  timestamp INTEGER NOT NULL,
  price JSON,
  pair VARCHAR,
  priceApiId VARCHAR,
  FOREIGN KEY (assetId) REFERENCES assets(id)
);
`)

  await account.execute(sql`
CREATE TABLE connections (
  id VARCHAR PRIMARY KEY,
  address VARCHAR,
  key VARCHAR,
  label VARCHAR,
  meta JSON,
  options JSON,
  platform VARCHAR NOT NULL,
  secret VARCHAR,
  syncedAt INTEGER,
  timestamp INTEGER NOT NULL
);
`)

  await account.execute(sql`
CREATE TABLE networth (
  timestamp INTEGER PRIMARY KEY,
  time INTEGER NOT NULL,
  value FLOAT NOT NULL,
  change FLOAT NOT NULL,
  changePercentage FLOAT NOT NULL
);
`)

  await account.execute(sql`
CREATE TABLE assets (
  id VARCHAR PRIMARY KEY,
  symbol VARCHAR NOT NULL,
  name VARCHAR,
  logoUrl VARCHAR,
  priceApiId VARCHAR,
  coingeckoId VARCHAR
);
`)

  await account.execute(sql`
CREATE TABLE IF NOT EXISTS server_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  description TEXT,
  priority INTEGER,
  startedAt INTEGER,
  completedAt INTEGER,
  duration INTEGER,
  errorMessage TEXT,
  trigger TEXT,
  status TEXT,
  createdAt INTEGER NOT NULL,
  determinate BOOLEAN
);
`)

  await account.execute(sql`
CREATE TABLE IF NOT EXISTS server_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, -- The name of the file
  description TEXT, -- Optional description of the file
  scheduledAt INTEGER NOT NULL, -- Timestamp of when the file task was scheduled
  status TEXT, -- Tracks the current status: scheduled, uploading, creating, aborted, completed, deleted
  progress INTEGER, -- From 0 to 100, for tracking upload or creation progress
  startedAt INTEGER, -- Timestamp of when the upload/creation started
  completedAt INTEGER, -- Timestamp of when the upload/creation was completed (NULL if not completed)
  deletedAt INTEGER, -- Timestamp of when the file was deleted (NULL if not deleted)
  metadata JSON, -- Additional metadata about the file (e.g., content type, encoding, creation time, etc.)
  createdBy TEXT NOT NULL -- 'user' or 'system'
);
`)

  return true
}

export async function ping() {
  return "pong"
}

export async function pingAccount(accountName: string) {
  const account = await getAccount(accountName)
  return (await account.execute(`SELECT "pong"`))[0][0]
}

export async function enqueueSleep(accountName: string, seconds: number, step = 1) {
  return enqueueTask(accountName, {
    description: `This action can be used for testing purposes.`,
    determinate: true,
    function: async (progress, signal) => {
      for (let i = 0; i < seconds; i += step) {
        if (signal?.aborted) throw new Error(signal.reason)
        await sleep(step * 1_000)
        await progress([((i + step) * 100) / seconds, `Slept for ${i + step} seconds`])
      }
    },
    name: "Sleep",
    priority: TaskPriority.Highest,
    trigger: "user",
  })
}

export async function subscribeToAccounts(
  callback: (cause: EventCause, accountName: string) => void
) {
  appEventEmitter.on(SubscriptionChannel.Accounts, callback)
  return () => appEventEmitter.off(SubscriptionChannel.Accounts, callback)
}

export async function getListenerCount() {
  return appEventEmitter.listenerCount(SubscriptionChannel.Accounts)
}

export async function getAccountNames() {
  try {
    await access(DATABASES_LOCATION)
  } catch {
    return []
  }
  const fileNames = await readdir(DATABASES_LOCATION)
  const validFiles = fileNames.filter(
    (file) => file.endsWith(".sqlite") && !file.endsWith("-journal.sqlite")
  )

  const files = await Promise.all(
    validFiles.map(async (file) => {
      const accountName = file.replace(".sqlite", "")
      const filePath = join(DATABASES_LOCATION, file)
      const stats = await stat(filePath)

      // we need to persist the createdAt timestamp in our KV store because the file stats keep on changing
      let createdAt = await getValue(accountName, `account_createdAt`, undefined)

      if (!createdAt) {
        createdAt = stats.ctime.getTime()
        await setValue(`account_createdAt`, createdAt, accountName)
      }

      return { createdAt, file }
    })
  )

  files.sort((a, b) => a.createdAt - b.createdAt)

  return files.map(({ file }) => file.replace(".sqlite", ""))
}

export async function getDiskUsage(accountName: string) {
  const filePath = join(DATABASES_LOCATION, `${accountName}.sqlite`)
  const stats = await stat(filePath)
  return stats.size
}

export async function executeSql(accountName: string, sql: string) {
  const account = await getAccount(accountName)
  return account.execute(sql)
}
