import { access, mkdir, readFile, writeFile } from "fs/promises"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { isTestEnvironment } from "src/utils/environment-utils"
import { sql } from "src/utils/sql-utils"
import { createSubscription } from "src/utils/sub-utils"
import { writesAllowed } from "src/utils/utils"
import webpush from "web-push"

import {
  EventCause,
  NewNotification,
  Notification,
  PushDevice,
  PushSub,
  SqlParam,
  SubscriptionChannel,
} from "../interfaces"
import { AUTH_DATA_DIR, VAPID_PRIVATE_KEY_FILE, VAPID_PUBLIC_KEY_FILE } from "../settings/settings"
import { getValue, setValue } from "./account/kv-api"
import { getAccount } from "./accounts-api"

type PayloadShape = {
  options: NotificationOptions & {
    badge?: string
    data?: { url?: string }
    icon?: string
    image?: string
    tag?: string
    timestamp?: number
  }
  title: string
}

const APP_URL = "https://privatefolio.app"
const SUBJECT = "https://privatefolio.app"

async function storeVapidKeys(publicKey: string, privateKey: string) {
  try {
    await access(AUTH_DATA_DIR)
  } catch {
    await mkdir(AUTH_DATA_DIR, { recursive: true })
  }
  await writeFile(VAPID_PUBLIC_KEY_FILE, publicKey, "utf8")
  await writeFile(VAPID_PRIVATE_KEY_FILE, privateKey, "utf8")
  if (!isTestEnvironment) console.log("⚠️ Stored VAPID keys.")
}

async function ensureVapidKeys() {
  let keys = await readVapidKeys()
  if (!keys) {
    keys = webpush.generateVAPIDKeys()
    await storeVapidKeys(keys.publicKey, keys.privateKey)
  }
  return keys
}

async function readVapidKeys() {
  try {
    const [publicKey, privateKey] = await Promise.all([
      readFile(VAPID_PUBLIC_KEY_FILE, "utf8"),
      readFile(VAPID_PRIVATE_KEY_FILE, "utf8"),
    ])
    return { privateKey, publicKey }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null
    }
    console.error("Error reading VAPID keys:", error)
    throw error
  }
}

async function loadVapidKeys() {
  const vapidKeys = await readVapidKeys()
  if (!vapidKeys) throw new Error("VAPID keys not configured")

  webpush.setVapidDetails(SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey)
}

async function getPushDevices(accountName: string): Promise<PushDevice[]> {
  const pushDevicesJson = await getValue<string>(accountName, "push_devices", null)
  if (!pushDevicesJson) return []

  try {
    return JSON.parse(pushDevicesJson)
  } catch (error) {
    console.error("Failed to parse push devices:", error)
    return []
  }
}

async function savePushDevices(accountName: string, devices: PushDevice[]): Promise<void> {
  await setValue(accountName, "push_devices", JSON.stringify(devices))
}

export async function addPushDevice(
  accountName: string,
  subscription: PushSub,
  deviceId: string,
  userAgent?: string
): Promise<void> {
  await getAccountWithNotifications(accountName)
  const existingDevices = await getPushDevices(accountName)

  const newDevice: PushDevice = {
    createdAt: Date.now(),
    deviceId,
    subscription,
    userAgent,
  }

  const filteredDevices = existingDevices.filter(
    (device) => device.subscription.endpoint !== subscription.endpoint
  )

  const updatedDevices = [...filteredDevices, newDevice]
  await savePushDevices(accountName, updatedDevices)
}

export async function removePushDevice(accountName: string, endpoint: string): Promise<void> {
  await getAccountWithNotifications(accountName)
  const existingDevices = await getPushDevices(accountName)

  const filteredDevices = existingDevices.filter(
    (device) => device.subscription.endpoint !== endpoint
  )

  await savePushDevices(accountName, filteredDevices)
}

/**
 * Send push notification to all devices
 */
export async function sendPushNotification(
  accountName: string,
  notification: Notification
): Promise<void> {
  await getAccountWithNotifications(accountName)
  const pushDevices = await getPushDevices(accountName)
  if (pushDevices.length === 0) {
    console.log("No push devices found")
    return
  }

  const payload: PayloadShape = {
    options: {
      badge: "/icon-512x512.png",
      body: notification.text,
      data: { url: APP_URL },
      icon: "/icon-512x512.png",
      tag: "General",
      timestamp: notification.createdAt * 1000,
    },
    title: notification.title,
  }

  const payloadStr = JSON.stringify(payload)

  // Send to all devices
  const sendPromises = pushDevices.map(({ subscription }) =>
    webpush.sendNotification(subscription, payloadStr).catch((error) => {
      console.error("Failed to send push notification:", error)

      // If the subscription is invalid, remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`Removing invalid subscription: ${subscription.endpoint}`)
        removePushDevice(accountName, subscription.endpoint).catch(console.error)
      }
    })
  )

  await Promise.allSettled(sendPromises)
}

/**
 * Create and send a push notification
 */
export async function createAndSendNotification(
  accountName: string,
  title: string,
  text: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const newNotification: NewNotification = {
    createdAt: Math.floor(Date.now() / 1000),
    metadata,
    status: 0, // 0 = unread
    text,
    title,
  }

  // Save to database first - this will return the notification with ID
  const savedNotification = await upsertNewNotification(accountName, newNotification)

  // Then send push notification
  await sendPushNotification(accountName, savedNotification)
}

export async function getVapidPublicKey(): Promise<string | null> {
  const keys = await ensureVapidKeys()
  return keys.publicKey
}

/**
 * Checks if VAPID keys have been set up (both key files exist)
 */
export async function isVapidSetupComplete(): Promise<boolean> {
  try {
    await Promise.all([access(VAPID_PUBLIC_KEY_FILE), access(VAPID_PRIVATE_KEY_FILE)])
    return true
  } catch {
    return false
  }
}

/**
 * Get all push devices (for management/debugging)
 */
export async function getAllPushDevices(accountName: string): Promise<PushDevice[]> {
  await getAccountWithNotifications(accountName)
  return getPushDevices(accountName)
}

const SCHEMA_VERSION = 3

export async function getAccountWithNotifications(accountName: string) {
  const account = await getAccount(accountName)
  if (!writesAllowed) return account

  await ensureVapidKeys()
  await loadVapidKeys()

  const schemaVersion = await getValue(accountName, `notifications_schema_version`, 0)

  if (schemaVersion < SCHEMA_VERSION) {
    if (schemaVersion < 2) {
      // Create notifications table (legacy schema)
      await account.execute(sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR PRIMARY KEY,
          title VARCHAR NOT NULL,
          text TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          isRead BOOLEAN DEFAULT FALSE,
          metadata JSON
        );
      `)

      await account.execute(
        sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(createdAt DESC)`
      )
      await account.execute(
        sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(isRead)`
      )
    }

    if (schemaVersion < 3) {
      // Migrate to new schema with auto-increment ID and status field
      await account.execute(sql`
        CREATE TABLE IF NOT EXISTS notifications_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title VARCHAR NOT NULL,
          text TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          status INTEGER DEFAULT 0,
          metadata JSON
        );
      `)

      // Migrate existing data if notifications table exists
      const tables = await account.execute(sql`
        SELECT name FROM sqlite_master WHERE type='table' AND name='notifications';
      `)

      if (tables.length > 0) {
        // Copy existing data, converting isRead to status
        await account.execute(sql`
          INSERT INTO notifications_new (title, text, createdAt, status, metadata)
          SELECT title, text, createdAt, CASE WHEN isRead THEN 1 ELSE 0 END, metadata
          FROM notifications
          ORDER BY createdAt;
        `)

        // Drop old table
        await account.execute(sql`DROP TABLE notifications;`)
      }

      // Rename new table
      await account.execute(sql`ALTER TABLE notifications_new RENAME TO notifications;`)

      await account.execute(
        sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(createdAt DESC)`
      )
      await account.execute(
        sql`CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)`
      )
    }

    // Initialize default values if needed
    const existingVapidKeys = await readVapidKeys()
    if (!existingVapidKeys) {
      // Could generate default VAPID keys here if desired
      // const keys = await generateAndStoreVapidKeys()
    }

    const existingDevices = await getPushDevices(accountName)
    if (existingDevices.length === 0) {
      // Initialize with empty devices array
      await savePushDevices(accountName, [])
    }

    await setValue(accountName, `notifications_schema_version`, SCHEMA_VERSION)
  }

  return account
}

export async function getNotifications(
  accountName: string,
  query = "SELECT * FROM notifications ORDER BY createdAt DESC",
  params?: SqlParam[]
): Promise<Notification[]> {
  const account = await getAccountWithNotifications(accountName)

  try {
    const result = await account.execute(query, params)

    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        title: row[1],
        text: row[2],
        createdAt: row[3],
        status: Number(row[4]) || 0,
        metadata: row[5] ? JSON.parse(row[5] as string) : undefined,
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as Notification
    })
  } catch (error) {
    if (!writesAllowed) return []
    throw new Error(`Failed to query notifications: ${error}`)
  }
}

export async function getNotification(accountName: string, id: number) {
  const records = await getNotifications(accountName, "SELECT * FROM notifications WHERE id = ?", [
    id,
  ])
  return records[0]
}

export async function upsertNotifications(
  accountName: string,
  records: (NewNotification | Notification)[]
): Promise<Notification[]> {
  const account = await getAccountWithNotifications(accountName)

  try {
    const results = await account.executeMany(
      `INSERT OR REPLACE INTO notifications (
        id, title, text, createdAt, status, metadata
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      records.map((record) => [
        "id" in record ? record.id : null,
        record.title,
        record.text,
        record.createdAt,
        record.status ?? 0,
        record.metadata ? JSON.stringify(record.metadata) : null,
      ])
    )

    account.eventEmitter.emit(SubscriptionChannel.Notifications, EventCause.Created)

    const ids = results.map((result) => result[0])
    const placeholders = ids.map(() => "?").join(",")

    return await getNotifications(
      accountName,
      `SELECT * FROM notifications WHERE id IN (${placeholders}) ORDER BY createdAt DESC`,
      ids
    )
  } catch (error) {
    throw new Error(`Failed to upsert notifications: ${error}`)
  }
}

export async function upsertNotification(
  accountName: string,
  notification: Notification | NewNotification
): Promise<Notification> {
  const results = await upsertNotifications(accountName, [notification])
  return results[0]
}

export async function upsertNewNotification(
  accountName: string,
  notification: NewNotification
): Promise<Notification> {
  return upsertNotification(accountName, notification)
}

export async function patchNotifications(
  accountName: string,
  ids: number[],
  patch: Partial<Notification>
) {
  const placeholders = ids.map(() => "?").join(",")
  const existing = await getNotifications(
    accountName,
    `SELECT * FROM notifications WHERE id IN (${placeholders}) ORDER BY createdAt DESC`,
    ids
  )
  const newValues = existing.map((notification) => ({
    ...notification,
    ...patch,
  }))

  await upsertNotifications(accountName, newValues)
}

export async function patchNotification(
  accountName: string,
  id: number,
  patch: Partial<Notification>
) {
  const existing = await getNotification(accountName, id)
  const newValue = { ...existing, ...patch }
  await upsertNotification(accountName, newValue)
}

export async function countNotifications(
  accountName: string,
  query = "SELECT COUNT(*) FROM notifications",
  params?: SqlParam[]
): Promise<number> {
  const account = await getAccountWithNotifications(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    if (!writesAllowed) return 0
    throw new Error(`Failed to count notifications: ${error}`)
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(accountName: string): Promise<void> {
  const account = await getAccountWithNotifications(accountName)
  if (!writesAllowed) return

  await account.execute(sql`UPDATE notifications SET status = 1 WHERE status = 0`)

  // Trigger subscription for notifications updates
  account.eventEmitter.emit(SubscriptionChannel.Notifications, EventCause.Updated, {
    allRead: true,
  })
}

/**
 * Subscribe to notification changes
 */
export function subscribeToNotifications(accountName: string, callback: () => void) {
  return createSubscription(accountName, SubscriptionChannel.Notifications, callback)
}
