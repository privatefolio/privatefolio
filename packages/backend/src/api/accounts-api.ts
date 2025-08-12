import { Logger } from "@logtape/logtape"
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
import { logger } from "src/logger"
import { DATABASES_LOCATION, FILES_LOCATION, TASK_LOGS_LOCATION } from "src/settings/settings"
import { createSqliteDatabaseConnection } from "src/sqlite/sqlite"
import { isTestEnvironment, writesAllowed } from "src/utils/environment-utils"
import { logAndReportError } from "src/utils/error-utils"
import { safeRemove } from "src/utils/file-utils"
import { ensureActiveAccount, isMarkedForDeletion, sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"
import { sleep, wasteCpuCycles } from "src/utils/utils"

import { enqueueRefetchAssets, getAccountWithAssets } from "./account/assets-api"
import { getAccountWithChatHistory } from "./account/assistant-api"
import { getAccountWithAuditLogs } from "./account/audit-logs-api"
import { getAccountWithBalances } from "./account/balances-api"
import { getAccountWithConnections } from "./account/connections-api"
import { getAccountWithDailyPrices } from "./account/daily-prices-api"
import { getAccountWithFileImports } from "./account/file-imports-api"
import { getValue, setValue } from "./account/kv-api"
import { getAccountWithNetworth } from "./account/networth-api"
import { enqueueRefetchPlatforms } from "./account/platforms-api"
import { getAccountWithServerFiles } from "./account/server-files-api"
import {
  enqueueTask,
  getAccountWithServerTasks,
  getAccountWithTaskQueue,
  upsertServerTask,
} from "./account/server-tasks-api"
import { getAccountWithTags } from "./account/tags-api"
import { getAccountWithTrades } from "./account/trades-api"
import { getAccountWithTransactions } from "./account/transactions-api"
import { allSubscriptions, appEventEmitter } from "./internal"

if (typeof window !== "undefined") {
  throw new Error(
    "Database should not be initialized in the browser, only in a web worker or node environment"
  )
}

const IN_MEMORY_DB = ":memory:"

async function createDatabaseConnection(
  accountName: string,
  createIfNeeded = false,
  logger: Logger
) {
  const databaseFilePath = isTestEnvironment
    ? IN_MEMORY_DB
    : join(DATABASES_LOCATION, `${accountName}.sqlite`)

  if (databaseFilePath !== IN_MEMORY_DB) {
    // ensure the file exists
    try {
      await ensureActiveAccount(accountName)
      await access(databaseFilePath)

      // logger.debug("Connecting to existing database", {
      //   dbPath: databaseFilePath,
      // })
    } catch {
      if (!createIfNeeded) throw new Error(`Account "${accountName}" does not exist`)
      logger.info("Creating database file", { dbPath: databaseFilePath })
      // ensure databases dir exists
      await mkdir(DATABASES_LOCATION, { recursive: true })
      await writeFile(databaseFilePath, "")
    }
  }

  const db = await createSqliteDatabaseConnection(databaseFilePath, accountName, logger)

  const journalMode = await db.execute(`PRAGMA journal_mode`)
  logger.info("Connected to database", {
    dbPath: databaseFilePath,
    journalMode: journalMode[0][0],
  })

  return db
}

export type DatabaseConnection = Awaited<ReturnType<typeof createDatabaseConnection>>

export type BaseAccount = DatabaseConnection & {
  eventEmitter: EventEmitter
  logger: Logger
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
      const childLogger = logger.getChild(accountName)
      const db: DatabaseConnection = await createDatabaseConnection(
        accountName,
        createIfNeeded,
        childLogger
      )
      const initialized = await initializeDatabaseIfNeeded(db, childLogger)
      if (initialized) {
        appEventEmitter.emit(SubscriptionChannel.Accounts, EventCause.Created, accountName)
        populateFirstServerTask(accountName)
      }
      const account: BaseAccount = {
        ...db,
        eventEmitter: new EventEmitter(),
        logger: childLogger,
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
  const account = await getAccount(accountName)
  account.logger.info("Deleting account")

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
    logAndReportError(error, "Failed to delete user data", {}, account.logger)
  }

  account.logger.info("Deleted account")
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
  const db: DatabaseConnection = await createDatabaseConnection(accountName, true, account.logger)
  await initializeDatabaseIfNeeded(db, account.logger)
  populateFirstServerTask(accountName)

  Object.assign(account, db)

  for (const channelName in SubscriptionChannel) {
    account.eventEmitter.emit(SubscriptionChannel[channelName], EventCause.Reset)
  }
  appEventEmitter.emit(SubscriptionChannel.Accounts, EventCause.Reset, accountName)
}

async function initializeDatabaseIfNeeded(
  account: DatabaseConnection,
  logger: Logger
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
    logger.trace("Skipping database initialization")
    return false
  }

  logger.info("Initializing database")
  try {
    await account.execute(`PRAGMA journal_mode = WAL;`)
  } catch {
    logger.warn("Failed to set journal mode to WAL")
  }

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

export async function computeActiveConnections() {
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
        logger.getChild(accountName).info("Account marked for deletion, removing user data")
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

export async function migrateTables(accountName: string) {
  const account = await getAccount(accountName)
  account.logger.info("Migrating database tables")
  await getAccountWithAssets(accountName)
  await getAccountWithAuditLogs(accountName)
  await getAccountWithBalances(accountName)
  await getAccountWithChatHistory(accountName)
  await getAccountWithConnections(accountName)
  await getAccountWithDailyPrices(accountName)
  await getAccountWithFileImports(accountName)
  await getAccountWithNetworth(accountName)
  await getAccountWithServerFiles(accountName)
  await getAccountWithServerTasks(accountName)
  await getAccountWithTags(accountName)
  await getAccountWithTaskQueue(accountName)
  await getAccountWithTrades(accountName)
  await getAccountWithTransactions(accountName)
}
