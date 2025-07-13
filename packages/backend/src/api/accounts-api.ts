import EventEmitter from "events"
import { access, mkdir, readdir, stat, writeFile } from "fs/promises"
import { join } from "path"
import {
  EventCause,
  SqlParam,
  SubscriptionChannel,
  SubscriptionId,
  TaskPriority,
  TaskStatus,
} from "src/interfaces"
import { DATABASES_LOCATION, FILES_LOCATION, TASK_LOGS_LOCATION } from "src/settings/settings"
import { createSqliteDatabaseConnection } from "src/sqlite/sqlite"
import { isDevelopment, isTestEnvironment, writesAllowed } from "src/utils/environment-utils"
import { safeRemove } from "src/utils/file-utils"
import { ensureActiveAccount, isMarkedForDeletion, sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"
import { getPrefix, sleep, wasteCpuCycles } from "src/utils/utils"

import { enqueueRefetchAssets } from "./account/assets-api"
import { getValue, setValue } from "./account/kv-api"
import { enqueueRefetchPlatforms } from "./account/platforms-api"
import { enqueueTask, upsertServerTask } from "./account/server-tasks-api"
import { allSubscriptions, appEventEmitter } from "./internal"

if (typeof window !== "undefined") {
  throw new Error(
    "Database should not be initialized in the browser, only in a web worker or node environment"
  )
}

const IN_MEMORY_DB = ":memory:"

async function createDatabaseConnection(accountName: string, createIfNeeded = false) {
  const databaseFilePath = isTestEnvironment
    ? IN_MEMORY_DB
    : join(DATABASES_LOCATION, `${accountName}.sqlite`)

  if (databaseFilePath !== IN_MEMORY_DB) {
    // ensure the file exists
    try {
      await ensureActiveAccount(accountName)
      await access(databaseFilePath)
      console.log(getPrefix(accountName), "Connecting to existing database", databaseFilePath)
    } catch {
      if (!createIfNeeded) throw new Error(`Account "${accountName}" does not exist`)
      console.log(getPrefix(accountName), "Creating database file", databaseFilePath)
      // ensure databases dir exists
      await mkdir(DATABASES_LOCATION, { recursive: true })
      await writeFile(databaseFilePath, "")
    }
  }

  const db = await createSqliteDatabaseConnection(databaseFilePath, accountName)

  const journalMode = await db.execute(`PRAGMA journal_mode`)
  if (isDevelopment) {
    console.log(getPrefix(accountName), "SQLite journal mode:", journalMode[0][0])
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
  if (isTestEnvironment) return
  setTimeout(async () => {
    await upsertServerTask(accountName, {
      completedAt: Date.now(),
      createdAt,
      description: `Initializing database for account "${accountName}".`,
      duration: Date.now() - createdAt,
      name: "Initialize database",
      priority: TaskPriority.High,
      startedAt: createdAt,
      status: TaskStatus.Completed,
      trigger: "system",
    })
    await enqueueRefetchPlatforms(accountName, "system", true)
    await enqueueRefetchAssets(accountName, "system", true)
  }, 50)
}

/**
 * Get a database connection for the given account.
 *
 * There is a 1:1 relationship between an account and a database (single-tenant).
 */
export async function getAccount(accountName: string, createIfNeeded = false): Promise<Account> {
  if (!accountName) throw new Error("Account name is required")

  let promise = accounts[accountName]

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
    promise = accounts[accountName]
  }

  return promise
    .then((x) => x)
    .catch((err) => {
      delete accounts[accountName]
      throw err
    })
}

export async function reconnectAccount(accountName: string) {
  await disconnectAccount(accountName)
  return getAccount(accountName)
}

export async function disconnectAccount(accountName: string) {
  try {
    const account = await getAccount(accountName)
    await account.close()
  } catch {}
  delete accounts[accountName]
}

function isValidFilename(name: string): boolean {
  // Windows and Unix filename restrictions
  const invalidChars = /[<>:"/\\|?*]/
  const hasControlChars = Array.from(name).some((char) => char.charCodeAt(0) < 32)
  return !invalidChars.test(name) && !hasControlChars && name.length > 0 && name.length <= 255
}

export async function createAccount(accountName: string) {
  if (!isValidFilename(accountName)) {
    throw new Error(
      "Account name contains invalid characters. Allowed characters: letters (a-z, A-Z), numbers (0-9), spaces, hyphens (-), underscores (_), periods (.), and parentheses ()."
    )
  }
  await getAccount(accountName, true)
}

async function deleteUserData(accountName: string) {
  // delete logs & database file
  await safeRemove(join(DATABASES_LOCATION, `${accountName}.sqlite`))
  await safeRemove(join(DATABASES_LOCATION, `${accountName}.sqlite-shm`))
  await safeRemove(join(DATABASES_LOCATION, `${accountName}.sqlite-wal`))
  await safeRemove(join(DATABASES_LOCATION, `${accountName}.deleting`))
  await safeRemove(join(TASK_LOGS_LOCATION, accountName))
  await safeRemove(join(FILES_LOCATION, accountName))
}

export async function deleteAccount(accountName: string, keepAccount = false) {
  if (!isTestEnvironment) console.log(getPrefix(accountName), "Deleting account.")

  const account = await getAccount(accountName)
  if (!isTestEnvironment) {
    await writeFile(
      join(DATABASES_LOCATION, `${accountName}.deleting`),
      "This account is marked for deletion."
    )
  }

  appEventEmitter.emit(SubscriptionChannel.Accounts, EventCause.Deleted, accountName)
  if (!keepAccount) delete accounts[accountName]

  try {
    await account.close()
    await deleteUserData(accountName)
  } catch (error) {
    console.error(getPrefix(accountName), "Failed to delete user data:", error)
  }

  if (!isTestEnvironment) console.log(getPrefix(accountName), "Deleted account.")
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
  appEventEmitter.emit(SubscriptionChannel.Accounts, EventCause.Reset, accountName)
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

  if (writesAllowed) {
    await account.execute(`PRAGMA busy_timeout = 2000;`)
  }

  if (tablesCount > 0) {
    console.log(getPrefix(accountName), "Skipping database initialization.")
    return false
  }

  if (!isTestEnvironment) console.log(getPrefix(accountName), "Initializing database.")
  try {
    await account.execute(`PRAGMA journal_mode = WAL;`)
  } catch {
    console.log(getPrefix(accountName), "Failed to set journal mode to WAL")
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

export async function enqueueSleep(
  accountName: string,
  seconds: number,
  step = 1,
  wasteCpu = false
) {
  return enqueueTask(accountName, {
    description: `This action can be used for testing purposes.`,
    determinate: true,
    function: async (progress, signal) => {
      for (let i = 0; i < seconds; i += step) {
        if (signal?.aborted) throw new Error(signal.reason)
        if (wasteCpu) {
          await wasteCpuCycles(step * 1_000)
        } else {
          await sleep(step * 1_000)
        }
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
  return createSubscription(undefined, SubscriptionChannel.Accounts, callback)
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

  let files = await Promise.all(
    validFiles.map(async (file) => {
      const accountName = file.replace(".sqlite", "")
      if (await isMarkedForDeletion(accountName)) {
        console.log(getPrefix(accountName), "Account marked for deletion, removing user data")
        try {
          await deleteUserData(accountName)
        } catch {}
        return null
      }
      const filePath = join(DATABASES_LOCATION, file)
      const stats = await stat(filePath)

      // we need to persist the createdAt timestamp in our KV store because the file stats keep on changing
      let createdAt = await getValue(accountName, `account_createdAt`, undefined)

      if (!createdAt) {
        createdAt = stats.ctime.getTime()
        try {
          await setValue(accountName, `account_createdAt`, createdAt)
        } catch {}
      }

      return { createdAt, file }
    })
  )

  files = files.filter((x) => x !== null)
  files.sort((a, b) => a.createdAt - b.createdAt)

  return files.map(({ file }) => file.replace(".sqlite", ""))
}

export async function getDiskUsage(accountName: string) {
  const filePath = join(DATABASES_LOCATION, `${accountName}.sqlite`)
  const stats = await stat(filePath)
  return stats.size
}

export async function executeSql(accountName: string, query: string, params?: SqlParam[]) {
  const account = await getAccount(accountName)
  return account.execute(query, params)
}

export async function readSql(accountName: string, query: string, params?: SqlParam[]) {
  const account = await getAccount(accountName)
  return account.execute(query, params)
}

export async function unsubscribe(subscriptionId: SubscriptionId, throwOnError = true) {
  try {
    const subscription = allSubscriptions.get(subscriptionId)
    if (!subscription) throw new Error(`Subscription not found: ${subscriptionId}`)

    const { channel, accountName, listener } = subscription
    // console.log("Unsubscribing", subscriptionId)

    if (accountName) {
      const account = await getAccount(accountName)
      account.eventEmitter.off(channel, listener)
    } else {
      appEventEmitter.off(channel, listener)
    }

    allSubscriptions.delete(subscriptionId)
  } catch (error) {
    if (throwOnError) throw error
  }
}
