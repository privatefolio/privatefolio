import { appendFile, mkdir, readFile } from "fs/promises"
import path from "path"
import {
  NewServerTask,
  ProgressCallback,
  ProgressUpdate,
  ServerTask,
  SqlParam,
  SubscriptionChannel,
  TaskCompletionCallback,
  TaskStatus,
} from "src/interfaces"
import { LOGS_LOCATION } from "src/settings"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { sleep } from "src/utils/utils"

import { Account, getAccount } from "../accounts-api"

export interface QueuedTask extends ServerTask {
  abortController?: AbortController
  function: (progressCallback: ProgressCallback, signal: AbortSignal) => Promise<unknown>
  onCompletion?: TaskCompletionCallback
}

export async function getServerTasks(
  accountName: string,
  query = "SELECT * FROM server_tasks ORDER BY id DESC",
  params?: SqlParam[]
): Promise<ServerTask[]> {
  const account = await ensureTaskQueue(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        name: row[1],
        description: row[2],
        priority: row[3],
        startedAt: row[4],
        completedAt: row[5],
        duration: row[6],
        errorMessage: row[7],
        trigger: row[8],
        status: row[9],
        createdAt: row[10],
        determinate: row[11],
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as ServerTask
    })
  } catch (error) {
    throw new Error(`Failed to query server tasks: ${error}`)
  }
}

export async function getServerTask(accountName: string, id: number) {
  const records = await getServerTasks(accountName, "SELECT * FROM server_tasks WHERE id = ?", [id])
  return records[0]
}

export async function upsertServerTasks(accountName: string, records: NewServerTask[]) {
  const account = await ensureTaskQueue(accountName)

  try {
    const results = await account.executeMany(
      `INSERT OR REPLACE INTO server_tasks (
        id, name, description, priority, startedAt, completedAt, duration, errorMessage, trigger, status, createdAt, determinate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      records.map((record) => [
        record.id || null,
        record.name,
        record.description,
        record.priority,
        record.startedAt || null,
        record.completedAt || null,
        record.duration || null,
        record.errorMessage || null,
        record.trigger || null,
        record.status || null,
        record.createdAt || null,
        record.determinate || null,
      ])
    )
    account.eventEmitter.emit(SubscriptionChannel.ServerTasks)

    const ids = results.map((result) => result[0])
    const placeholders = ids.map(() => "?").join(",")

    return await getServerTasks(
      accountName,
      `SELECT * FROM server_tasks WHERE id IN (${placeholders})`,
      ids
    )
  } catch (error) {
    throw new Error(`Failed to add or replace server tasks: ${error}`)
  }
}

export async function upsertServerTask(accountName: string, record: NewServerTask) {
  const results = await upsertServerTasks(accountName, [record])
  return results[0]
}

export async function patchServerTask(accountName: string, id: number, patch: Partial<ServerTask>) {
  const existing = await getServerTask(accountName, id)
  const newValue = { ...existing, ...patch }
  await upsertServerTask(accountName, newValue)
}

export async function countServerTasks(
  accountName: string,
  query = "SELECT COUNT(*) FROM server_tasks",
  params?: SqlParam[]
): Promise<number> {
  const account = await ensureTaskQueue(accountName)

  try {
    const result = await account.execute(query, params)
    return result[0][0] as number
  } catch (error) {
    throw new Error(`Failed to count server tasks: ${error}`)
  }
}

function createProgressCallback(account: Account, taskId: number): ProgressCallback {
  const logFilePath = path.join(LOGS_LOCATION, account.name, `server_task_${taskId}.log`)

  return async (update: ProgressUpdate) => {
    try {
      const logEntry = `${new Date().toISOString()} ${JSON.stringify(update)}\n`
      // save to file
      await mkdir(path.join(LOGS_LOCATION, account.name), { recursive: true })
      await appendFile(logFilePath, logEntry)
      // emit event
      account.eventEmitter.emit(SubscriptionChannel.ServerTaskProgress, taskId, logEntry)
    } catch (error) {
      // console.error("Failed to log progress update to file:", error)
    }
  }
}

export async function getTriggers(
  accountName: string,
  query = "SELECT DISTINCT trigger FROM server_tasks ORDER BY trigger ASC",
  params: SqlParam[] = []
): Promise<string[]> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => row[0] as string)
  } catch (error) {
    throw new Error(`Failed to query triggers: ${error}`)
  }
}

async function processQueue(accountName: string) {
  const account = await ensureTaskQueue(accountName)

  // If already processing, don't start another process
  if (account.isProcessing) return

  account.isProcessing = true

  try {
    while (account.taskQueue.length !== 0) {
      const task = account.taskQueue.shift()

      if (task) {
        const startTime = Date.now()
        task.startedAt = startTime
        task.abortController = new AbortController()
        account.pendingTask = task
        let errorMessage: string | undefined

        await patchServerTask(accountName, task.id, {
          startedAt: startTime,
          status: "running",
        })

        try {
          const progressCallback = createProgressCallback(account, task.id)
          await Promise.race([
            task.function(progressCallback, task.abortController.signal),
            // Give the task a 5 second grace period to finish up, otherwise abort it
            (async () => {
              while (task.abortController.signal.aborted === false) {
                await sleep(5_000)
              }
              throw new Error(task.abortController.signal.reason)
            })(),
          ])
        } catch (error) {
          // console.error("Error processing task:", error)
          errorMessage = String(error)
        } finally {
          let status: TaskStatus = "completed"
          if (errorMessage) status = "failed"
          if (errorMessage && task.abortController.signal.aborted) status = "aborted"
          if (task.abortController.signal.reason !== "reset") {
            const completedAt = Date.now()

            await patchServerTask(accountName, task.id, {
              completedAt,
              duration: completedAt - startTime,
              errorMessage,
              status,
            })

            account.pendingTask = undefined
          }
          if (task.onCompletion) {
            task.onCompletion(errorMessage ? new Error(errorMessage) : undefined)
          }
        }
      }
    }
  } finally {
    account.isProcessing = false
  }
}

declare module "../accounts-api" {
  interface AccountExtensions {
    isProcessing: boolean
    pendingTask: QueuedTask | undefined
    taskQueue: QueuedTask[]
  }
}

async function ensureTaskQueue(accountName: string) {
  const account = await getAccount(accountName)

  if (account.taskQueue === undefined) {
    account.isProcessing = false
    account.taskQueue = []
    account.pendingTask = undefined

    // Check if there are any pending tasks in the database
    const tasks = await getServerTasks(
      accountName,
      "SELECT * FROM server_tasks WHERE status = 'queued' or status = 'running'"
    )
    for (const task of tasks) {
      await patchServerTask(accountName, task.id, {
        errorMessage: "Server restarted.",
        status: task.status === "running" ? "aborted" : "cancelled",
      })
    }
  }

  return account
}

export async function enqueueTask(
  accountName: string,
  task: Omit<QueuedTask, "id" | "startedAt" | "abortController" | "status" | "createdAt">
) {
  const { taskQueue, isProcessing } = await ensureTaskQueue(accountName)

  const existing = taskQueue.find((x) => x.name === task.name)
  if (existing) return existing.id

  const createdAt = Date.now()
  const status = "queued"

  const { id } = await upsertServerTask(accountName, { ...task, createdAt, status })
  taskQueue.push({ ...task, createdAt, id, status })
  taskQueue.sort((a, b) => b.priority - a.priority)

  if (!isProcessing) {
    processQueue(accountName)
  }

  return id
}

export async function cancelTask(accountName: string, taskId: number) {
  const account = await ensureTaskQueue(accountName)

  if (account.pendingTask?.id === taskId) {
    console.log("Aborting task with id:", account.pendingTask.id)
    account.pendingTask.abortController?.abort("Task aborted by user.")
  } else if (account.taskQueue.some((x) => x.id === taskId)) {
    account.taskQueue = account.taskQueue.filter((x) => x.id !== taskId)
    await patchServerTask(accountName, taskId, {
      errorMessage: "Task cancelled by user.",
      status: "cancelled",
    })
  } else {
    throw new Error(`Task with id ${taskId} not found.`)
  }
}

export async function subscribeToServerTasks(accountName: string, callback: () => void) {
  const account = await ensureTaskQueue(accountName)
  account.eventEmitter.on(SubscriptionChannel.ServerTasks, callback)
  return () => account.eventEmitter.off(SubscriptionChannel.ServerTasks, callback)
}

export async function getServerTaskLog(accountName: string, taskId: number) {
  const logFilePath = path.join(LOGS_LOCATION, accountName, `server_task_${taskId}.log`)

  try {
    return readFile(logFilePath, "utf-8")
  } catch (error) {
    console.error(`Failed to read ${logFilePath}`, error)
    throw error
  }
}

export async function subscribeToServerTaskProgress(
  accountName: string,
  id: number,
  callback: (logEntry: string) => void
) {
  const account = await ensureTaskQueue(accountName)

  function listener(taskId: number, logEntry: string) {
    if (taskId === id) {
      callback(logEntry)
    }
  }

  account.eventEmitter.on(SubscriptionChannel.ServerTaskProgress, listener)
  return () => account.eventEmitter.off(SubscriptionChannel.ServerTaskProgress, listener)
}
