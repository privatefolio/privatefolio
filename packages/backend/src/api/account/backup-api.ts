import {
  access,
  appendFile,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  unlink,
  writeFile,
} from "fs/promises"
import JSZip from "jszip"
import { join } from "path"
import type { NewServerTask, TaskStatus } from "src/interfaces"
import { ProgressCallback, ServerFile, TaskPriority, TaskTrigger } from "src/interfaces"
import { DATABASES_LOCATION, FILES_LOCATION, TASK_LOGS_LOCATION } from "src/settings/settings"
import { noop, parseProgressLog } from "src/utils/utils"

import { getAccount, reconnectAccount } from "../accounts-api"
import { getServerFiles, patchServerFile, upsertServerFile } from "./server-files-api"
import {
  enqueueTask,
  getServerTaskLog,
  getServerTasks,
  patchServerTask,
  upsertServerTask,
} from "./server-tasks-api"

export async function backup(
  accountName: string,
  progress: ProgressCallback = noop
): Promise<ServerFile> {
  const account = await getAccount(accountName)
  const userFilesDir = join(FILES_LOCATION, accountName)
  const userLogsDir = join(TASK_LOGS_LOCATION, accountName)

  const backupFilename = `${accountName}-backup.sqlite`
  const backupPath = join(DATABASES_LOCATION, backupFilename)
  const archiveFilename = `${accountName}-backup.zip`

  const zip = new JSZip()

  try {
    await progress([0, `Starting full backup for account: ${accountName}`])

    // 1. Backup SQLite database using VACUUM INTO
    await progress([5, `Backing up database to: ${backupPath}`])
    const vacuumIntoPathSQL = backupPath.replace(/'/g, "''")
    await account.execute(`VACUUM INTO '${vacuumIntoPathSQL}'`)
    await progress([25, `Database backup completed. Reading file for zipping.`])

    await access(backupPath)
    const dbFile = await readFile(backupPath)
    zip.file("database.sqlite", dbFile)
    await progress([30, `Database added to zip archive.`])

    // 2. Add user files from FILES_LOCATION/{accountName}
    await progress([30, `Filtering and adding user-created files from ${userFilesDir}`])
    try {
      await access(userFilesDir) // Check if user files directory exists

      // Get all server file records for the account
      const allServerFiles = await getServerFiles(accountName)
      // Create a set of IDs for files created by the user
      const userFileIds = new Set(
        allServerFiles.filter((sf) => sf.createdBy === "user").map((sf) => sf.id.toString())
      )

      const allFilesInDir = await readdir(userFilesDir, { withFileTypes: true })
      // Filter disk files to include only those created by the user and are actual files
      const userDiskFilesToBackup = allFilesInDir.filter(
        (dirent) => dirent.isFile() && userFileIds.has(dirent.name)
      )

      const archiveFolder = zip.folder("files")
      let filesProcessed = 0
      const totalUserFilesToBackup = userDiskFilesToBackup.length

      if (totalUserFilesToBackup > 0) {
        for (const dirent of userDiskFilesToBackup) {
          // dirent.name is the ServerFile ID as a string
          const serverFileRecord = allServerFiles.find((sf) => sf.id.toString() === dirent.name)
          const displayFilename = serverFileRecord ? serverFileRecord.name : dirent.name // Fallback to ID if name not found

          const filePath = join(userFilesDir, dirent.name)
          await access(filePath)
          const fileContent = await readFile(filePath)
          archiveFolder.file(dirent.name, fileContent) // Use dirent.name (the ID) as filename in zip
          filesProcessed++
          await progress([
            30 + (30 * filesProcessed) / totalUserFilesToBackup,
            `Added user file ${displayFilename} to zip.`,
          ])
        }
      }

      if (totalUserFilesToBackup === 0) {
        await progress([60, `No user-created files found in ${userFilesDir} to add.`])
      } else {
        await progress([60, `All ${totalUserFilesToBackup} user-created files added to zip.`])
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        await progress([
          60,
          `User files directory ${userFilesDir} not found. Skipping file backup.`,
        ])
      } else {
        throw error
      }
    }

    // 3. Add log contents for the user
    await progress([60, `Adding user logs from ${userLogsDir}`])
    try {
      await access(userLogsDir) // Check if user logs directory exists
      const logsDir = await readdir(userLogsDir, { withFileTypes: true })
      const archiveFolder = zip.folder("logs")
      let logsProcessed = 0
      const logFilesToBackup = logsDir
        .filter((dirent) => dirent.isFile())
        .sort((a, b) => a.name.localeCompare(b.name)) // Sort by name (ID) ASC

      const totalLogFiles = logFilesToBackup.length

      if (totalLogFiles > 0) {
        for (const dirent of logFilesToBackup) {
          // No need to check dirent.isFile() again as it's already filtered
          const logFilePath = join(userLogsDir, dirent.name)
          await access(logFilePath)
          const logFileContent = await readFile(logFilePath)
          archiveFolder.file(dirent.name, logFileContent)
          logsProcessed++
          await progress([
            60 + (30 * logsProcessed) / totalLogFiles,
            `Added log file ${dirent.name} to zip.`,
          ])
        }
      }
      if (totalLogFiles === 0) {
        await progress([90, `No log files found in ${userLogsDir} to add.`])
      } else {
        await progress([90, `All log files added to zip.`])
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        await progress([90, `User logs directory ${userLogsDir} not found. Skipping log backup.`])
      } else {
        throw error
      }
    }

    // 4. Finalizing
    await progress([90, `Generating final zip archive: ${archiveFilename}`])
    const zipBufferData = await zip.generateAsync({
      compression: "DEFLATE",
      compressionOptions: {
        level: 6, // Default is 6, good balance of speed and compression
      },
      type: "nodebuffer",
    })

    await progress([95, `Saving full backup file record: ${archiveFilename}`])
    const fileRecord = await saveBackupFile(
      accountName,
      zipBufferData,
      archiveFilename,
      "application/zip"
    )
    await progress([
      99,
      `Full backup zip file ${archiveFilename} saved. ServerFile ID: ${fileRecord.id}`,
    ])

    return fileRecord
  } catch (error) {
    await progress([undefined, `Full backup failed for account ${accountName}: ${error.message}`])
    throw error
  } finally {
    try {
      await access(backupPath)
      await unlink(backupPath)
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") {
        console.warn(
          `Failed to delete temporary DB backup file ${backupPath} for account ${accountName}. Error:`,
          cleanupError
        )
      }
    }
  }
}

async function saveBackupFile(
  accountName: string,
  bufferData: Buffer,
  name: string,
  mimeType: string
): Promise<ServerFile> {
  const fileRecord = await upsertServerFile(accountName, {
    createdBy: "system",
    metadata: {
      lastModified: Date.now(),
      size: bufferData.length,
      type: mimeType,
    },
    name,
    scheduledAt: Date.now(),
    status: "scheduled",
  })

  await patchServerFile(accountName, fileRecord.id, {
    startedAt: Date.now(),
    status: "uploading",
    //
  })

  const uploadDir = join(FILES_LOCATION, accountName)

  // Ensure the directory for the account exists, create it if not
  try {
    await access(uploadDir)
  } catch {
    // Directory doesn't exist, create it
    await mkdir(uploadDir, { recursive: true })
  }

  const filePath = join(uploadDir, String(fileRecord.id))

  try {
    await writeFile(filePath, bufferData)
    await patchServerFile(accountName, fileRecord.id, {
      completedAt: Date.now(),
      progress: 100,
      status: "completed",
      //
    })
  } catch (error) {
    await patchServerFile(accountName, fileRecord.id, {
      completedAt: Date.now(),
      status: "aborted",
      //
    })
    throw error
  }

  return fileRecord
}

export async function restore(
  accountName: string,
  fileRecord: ServerFile,
  progress: ProgressCallback = noop
) {
  await progress([0, "Initializing account restoration..."])

  const backupFileStoragePath = join(FILES_LOCATION, accountName, fileRecord.id.toString())
  const tempRestoreDir = join(DATABASES_LOCATION, `${accountName}-restore-temp-${Date.now()}`)
  const liveDbPath = join(DATABASES_LOCATION, `${accountName}.sqlite`)
  const liveDbPreRestoreBackupPath = `${liveDbPath}.pre-restore-${Date.now()}`
  let originalDbRestoredOnError = false
  let operationError: Error | null = null // Flag to track if an error occurred in the try block

  try {
    await progress([5, `Creating temporary directory: ${tempRestoreDir}`])
    await mkdir(tempRestoreDir, { recursive: true })

    await progress([10, `Reading backup file: ${fileRecord.name}`])
    await access(backupFileStoragePath)
    const backupZipBuffer = await readFile(backupFileStoragePath)

    await progress([15, "Loading backup ZIP contents..."])
    const zip = new JSZip()
    const loadedZip = await zip.loadAsync(backupZipBuffer)

    // --- 1. Database Restoration ---
    const dbFilename = "database.sqlite"
    const dbZipEntry = loadedZip.file(dbFilename)
    if (!dbZipEntry) {
      throw new Error(`Database file '${dbFilename}' not found in backup zip.`)
    }
    await progress([15, `Extracting database file '${dbFilename}'...`])
    const extractedDbBuffer = await dbZipEntry.async("nodebuffer")
    const tempExtractedDbPath = join(tempRestoreDir, dbFilename)
    await writeFile(tempExtractedDbPath, extractedDbBuffer)

    await progress([20, "Closing current database connection..."])
    const account = await getAccount(accountName)
    await account.close()

    await progress([25, `Backing up current live database to ${liveDbPreRestoreBackupPath}`])
    try {
      await access(liveDbPath) // Check if live DB exists before trying to rename
      await rename(liveDbPath, liveDbPreRestoreBackupPath)
    } catch (error) {
      if (error.code === "ENOENT") {
        await progress([27, "No existing live database to backup. Proceeding."])
      } else {
        throw error // Rethrow other rename errors
      }
    }

    await progress([30, "Replacing live database with restored version..."])
    await rename(tempExtractedDbPath, liveDbPath) // Move extracted DB to live path

    await progress([35, "Verifying new database connection..."])
    try {
      await reconnectAccount(accountName)
      await progress([40, "New database connection verified."])
    } catch (verificationError) {
      await progress([37, "Failed to verify new database. Attempting to roll back live DB..."])
      try {
        await access(liveDbPreRestoreBackupPath)
        await rename(liveDbPreRestoreBackupPath, liveDbPath)
        originalDbRestoredOnError = true
        await progress([38, "Original live database rolled back."])
      } catch (rollbackError) {
        throw new Error(
          `Failed to verify new database AND failed to roll back original database. Account: ${accountName} may be in an inconsistent state. Error: ${verificationError.message}, Rollback Error: ${rollbackError.message}`
        )
      }
      throw verificationError
    }

    // --- 2. User Files Restoration ---
    const userFilesZipFolder = loadedZip.folder("files")
    if (userFilesZipFolder) {
      await progress([45, "Restoring user files..."])
      const liveUserFilesPath = join(FILES_LOCATION, accountName)
      await mkdir(liveUserFilesPath, { recursive: true })

      const fileZipEntries = []
      userFilesZipFolder.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          fileZipEntries.push({ relativePath, zipEntry })
        }
      })

      let filesRestoredCount = 0
      for (const { relativePath, zipEntry } of fileZipEntries) {
        const fileData = await zipEntry.async("nodebuffer")
        const targetFilePath = join(liveUserFilesPath, relativePath)
        await writeFile(targetFilePath, fileData)
        filesRestoredCount++
        // User files restoration: 45% to 65% (20% range)
        await progress([
          45 + (20 * filesRestoredCount) / fileZipEntries.length,
          `Restored user file: ${relativePath}`,
        ])
      }
      if (fileZipEntries.length > 0) {
        await progress([65, `All user files restored to ${liveUserFilesPath}.`])
      } else {
        await progress([65, "No user files found in backup to restore."])
      }
    } else {
      await progress([65, "No 'files' folder found in backup. Skipping user files restoration."])
    }

    // --- 3. Log Files Restoration ---
    const logsZipFolder = loadedZip.folder("logs")
    if (logsZipFolder) {
      await progress([65, "Restoring log files..."])
      const liveUserLogsPath = join(TASK_LOGS_LOCATION, accountName)
      await mkdir(liveUserLogsPath, { recursive: true }) // Ensure target directory exists

      const logZipEntries = []
      logsZipFolder.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          logZipEntries.push({ relativePath, zipEntry })
        }
      })

      let logsRestoredCount = 0
      for (const { relativePath, zipEntry } of logZipEntries) {
        const logFileData = await zipEntry.async("nodebuffer")
        const targetLogFilePath = join(liveUserLogsPath, relativePath)
        await writeFile(targetLogFilePath, logFileData) // Overwrites if exists
        logsRestoredCount++
        // Log files restoration: 65% to 85% (20% range)
        await progress([
          65 + (20 * logsRestoredCount) / logZipEntries.length,
          `Restored log file: ${relativePath}`,
        ])
      }
      if (logZipEntries.length > 0) {
        await progress([85, `All log files restored to ${liveUserLogsPath}.`])
      } else {
        await progress([85, "No log files found in backup to restore."])
      }
    } else {
      await progress([85, "No 'logs' folder found in backup. Skipping log files restoration."])
    }

    await progress([85, "Restore complete. Finalizing..."]) // End of actual restore operations, before final cleanup progress updates
  } catch (error) {
    operationError = error // Capture the error
    await progress([undefined, `Restore failed: ${error.message}`])
    // If DB was rolled back successfully, no need to re-throw or it masks the original error.
    // If DB rollback failed, that more critical error is already thrown.
    // If error happened before DB operations or after successful DB restore, throw current error.
    if (!originalDbRestoredOnError) {
      // Only rethrow if it's not an error that we already handled by restoring the original DB.
      // If verificationError was thrown and DB rolled back, verificationError is the one to propagate.
      throw error
    }
    // If originalDbRestoredOnError is true, the verificationError (or its wrapper) has been thrown.
  } finally {
    await progress([90, `Cleaning up temporary directory: ${tempRestoreDir} ...`]) // Cleanup starts at 90%
    try {
      await rm(tempRestoreDir, { force: true, recursive: true })
      await progress([92, "Temporary directory cleaned up."])
    } catch (cleanupError) {
      console.warn(
        `Failed to clean up temporary restore directory ${tempRestoreDir}:`,
        cleanupError
      )
    }

    if (!originalDbRestoredOnError && liveDbPreRestoreBackupPath) {
      try {
        if (!operationError) {
          await access(liveDbPreRestoreBackupPath)
          await unlink(liveDbPreRestoreBackupPath)
          await progress([95, "Pre-restore database backup cleaned up."])
        }
      } catch (dbBackupCleanupError) {
        if (dbBackupCleanupError.code !== "ENOENT") {
          console.warn(
            `Failed to clean up pre-restore DB backup ${liveDbPreRestoreBackupPath}:`,
            dbBackupCleanupError
          )
        }
        // If ENOENT, it's already gone or wasn't created, still progress
        await progress([95, "Pre-restore database backup cleanup processed."])
      }
    } else if (operationError || originalDbRestoredOnError) {
      // If there was an error or DB was rolled back, ensure progress still hits near end before final message
      await progress([95, "Cleanup phase continued despite previous errors or rollback."])
    }

    const finalMessage = originalDbRestoredOnError
      ? "Restore failed, original database preserved."
      : operationError
        ? "Restore failed with errors."
        : "Account restoration process finished successfully."
    await progress([100, finalMessage])
  }
}

export async function enqueueBackup(accountName: string, trigger: TaskTrigger) {
  return new Promise<ServerFile>((resolve, reject) => {
    enqueueTask(accountName, {
      description:
        "Backup account data, which can be used for restoring or migrating to another device.",
      determinate: true,
      function: async (progress) => {
        try {
          const fileRecord = await backup(accountName, progress)
          resolve(fileRecord)
        } catch (error) {
          reject(error)
          throw error
        }
      },
      name: "Backup",
      priority: TaskPriority.Low,
      trigger,
    })
  })
}

export async function enqueueRestore(accountName: string, trigger: TaskTrigger, file: ServerFile) {
  return enqueueTask(accountName, {
    description: `Restore account from backup file: ${file.name}.`,
    determinate: true,
    function: async (originalProgressCallback: ProgressCallback) => {
      const savedLogs: string[] = []

      const progressCallback: ProgressCallback = async (update) => {
        const logEntry = `${new Date().toISOString()} ${JSON.stringify(update)}\n`
        savedLogs.push(logEntry)
        await originalProgressCallback(update)
      }

      const startedAt = Date.now()
      let errorMessage: string | undefined
      let status: TaskStatus = "completed"

      try {
        await restore(accountName, file, progressCallback)

        try {
          // The backup task was marked completed, so we need to mark it as completed
          const runningTasks = await getServerTasks(
            accountName,
            "SELECT * FROM server_tasks WHERE status = 'aborted' ORDER BY startedAt DESC LIMIT 1"
          )
          if (runningTasks.length > 0) {
            const backupTask = runningTasks[0]

            const logsString = await getServerTaskLog(accountName, backupTask.id)
            // Get the last log entry date
            const logs = logsString.split("\n")
            // -2 because the last line is always empty
            const lastLogEntry = logs[logs.length - 2]
            const completedAt = new Date(parseProgressLog(lastLogEntry)[0])

            const progressLogMessage =
              "The remaining logs are not available (task finalized post-backup)."
            const progressUpdateJsonString = JSON.stringify([undefined, progressLogMessage])
            const fullLogLine = `${completedAt.toISOString()} ${progressUpdateJsonString}\n`

            const taskLogDir = join(TASK_LOGS_LOCATION, accountName)
            const taskLogFilePath = join(taskLogDir, `server_task_${backupTask.id}.log`)

            try {
              await mkdir(taskLogDir, { recursive: true })
              await appendFile(taskLogFilePath, fullLogLine, "utf-8")
            } catch (logError) {
              console.warn(
                `Failed to append '${progressLogMessage}' to task ${backupTask.id} for account ${accountName} after restore:`,
                logError
              )
            }

            await patchServerTask(accountName, backupTask.id, {
              completedAt: completedAt.getTime(),
              duration: completedAt.getTime() - backupTask.startedAt,
              errorMessage: null,
              status: "completed",
            })
          }
        } catch {}
      } catch (error) {
        errorMessage = error.message
        status = "failed"
        const errorLogEntry = `${new Date().toISOString()} ${JSON.stringify([undefined, `Restore account failed: ${error.message}`])}\n`
        savedLogs.push(errorLogEntry)
        throw error
      } finally {
        const completedAt = Date.now()
        const taskRecord: NewServerTask = {
          completedAt,
          createdAt: startedAt,
          description: `Restore account from backup file: ${file.name}.`,
          determinate: true,
          duration: completedAt - startedAt,
          errorMessage,
          name: "Restore account",
          priority: TaskPriority.Highest,
          startedAt,
          status,
          trigger,
        }

        try {
          const savedTask = await upsertServerTask(accountName, taskRecord)
          const logDir = join(TASK_LOGS_LOCATION, accountName)
          await mkdir(logDir, { recursive: true })
          const logFilePath = join(logDir, `server_task_${savedTask.id}.log`)
          await writeFile(logFilePath, savedLogs.join(""))
        } catch (error) {
          console.error(
            `Failed to save restore task record/logs for account ${accountName}:`,
            error
          )
        }
      }
    },
    name: "Restore account",
    priority: TaskPriority.Highest,
    trigger,
  })
}
