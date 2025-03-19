import { atom, map } from "nanostores"
import { ProgressUpdate, ServerTask } from "src/interfaces"

export const $taskHistory = atom<ServerTask[]>([])
export const $taskQueue = atom<ServerTask[]>([])
export const $pendingTask = atom<ServerTask | undefined>()
export const $progressHistory = map<Record<ServerTask["id"], Record<string, ProgressUpdate>>>({})

// logAtoms({ $pendingTask, $taskHistory, $taskQueue })
