import { proxy } from "comlink"
import { atom, map } from "nanostores"

import { timeQueue } from "../utils/utils"

export enum TaskPriority {
  Low = 2,
  Medium = 5,
  MediumPlus = 6,
  High = 8,
  VeryHigh = 10,
  Ultra = 11,
}

export type ProgressUpdate = [] | [number] | [number | undefined, string]
export type ProgressCallback = (state: ProgressUpdate) => void

export interface Task {
  abortController?: AbortController
  /**
   * @default false
   */
  abortable?: boolean
  description: string
  /**
   * @default false
   */
  determinate?: boolean
  function: (progressCallback: ProgressCallback, signal: AbortSignal) => Promise<unknown>
  id: string
  name: string
  priority: TaskPriority
  startedAt?: number
}

export interface FinishedTask extends Omit<Task, "function"> {
  completedAt?: number
  duration: number // Duration in milliseconds
  errorMessage?: string
}

export const $taskHistory = atom<FinishedTask[]>([])
export const $taskQueue = atom<Task[]>([])
export const $pendingTask = atom<Task | undefined>()
export const $progressHistory = map<Record<string, Record<number, ProgressUpdate>>>({})

// logAtoms({ $pendingTask, $taskHistory, $taskQueue })

function createProgressCallback(taskId: string) {
  return timeQueue((update: ProgressUpdate) => {
    const updates = {
      ...$progressHistory.get()[taskId],
      [Date.now()]: update,
    }
    // const updates = [..., update]
    $progressHistory.setKey(taskId, updates)
  }, 10)
}

let isProcessing = false // Flag to check if processQueue is already running

function dequeue(): Task | undefined {
  const newQueue = [...$taskQueue.get()]
  const task = newQueue.shift()
  $taskQueue.set(newQueue)
  return task
}

async function processQueue() {
  isProcessing = true
  while ($taskQueue.get().length !== 0) {
    const task = dequeue()

    if (task) {
      const startTime = Date.now()
      task.startedAt = startTime
      task.abortController = new AbortController()
      $progressHistory.setKey(task.id, [])
      $pendingTask.set(task)
      let errorMessage: string | undefined

      try {
        // console.log(`Processing task: ${task.name}`)
        const callback = createProgressCallback(task.id)
        await task.function(proxy(callback), task.abortController.signal)
      } catch (error) {
        // console.error("Error processing task:", error)
        errorMessage = String(error)
      } finally {
        // console.log(`Completed task: ${task.name}`)
        const completedAt = Date.now()
        $pendingTask.set(undefined)
        $taskHistory.set([
          {
            ...task,
            completedAt,
            duration: completedAt - startTime, // Calculate duration
            errorMessage,
          },
          ...$taskHistory.get(),
        ])
      }
    } else {
      $pendingTask.set(undefined)
    }
  }
  isProcessing = false
}

export function enqueueTask(
  item: Omit<Task, "id" | "startedAt" | "abortController"> & { priority?: TaskPriority }
) {
  const newTask = {
    ...item,
    id: Math.random().toString(36).slice(2, 9),
  }
  const newQueue = [...$taskQueue.get(), newTask]
  newQueue.sort((a, b) => b.priority - a.priority)
  $taskQueue.set(newQueue)

  if (!isProcessing) {
    processQueue()
  }
}

export function cancelTask(taskId: string) {
  const pendingTask = $pendingTask.get()
  if (pendingTask?.id === taskId) {
    console.log("Aborting task with id:", pendingTask.id)
    pendingTask.abortController?.abort("Task interrupted by user.")
  } else {
    const newQueue = $taskQueue.get().filter((x) => x.id !== taskId)
    $taskQueue.set(newQueue)
  }
}
