import { access, mkdir, writeFile } from "fs/promises"
import JSZip from "jszip"
import { join } from "path"
import { ProgressCallback, ServerFile, TaskPriority, TaskTrigger } from "src/interfaces"
import { FILES_LOCATION } from "src/settings"
import { createCsvString, extractColumnsFromRow } from "src/utils/csv-utils"
import { noop } from "src/utils/utils"

import { Account, getAccount } from "../accounts-api"
import { patchServerFile, upsertServerFile } from "./server-files-api"
import { enqueueTask } from "./server-tasks-api"

async function exportTableToCSV(account: Account, table: string, progress: ProgressCallback) {
  const tableInfo = await account.execute(`PRAGMA table_info(${table})`)
  const columnNames = tableInfo.map((columnInfo) => columnInfo[1])

  const rows = await account.execute(`SELECT ${columnNames.join(", ")} FROM ${table}`)

  if (rows.length === 0) {
    // console.log(`Table ${table} is empty. No CSV created.`)
    return ""
  }

  const header = createCsvString([columnNames])
  const data = createCsvString(rows)
  await progress([undefined, `Writing the csv for ${table}`])
  const csvContent = `${header}\n${data}`

  return csvContent
}

export async function backupAccount(
  accountName: string,
  progress: ProgressCallback = noop
): Promise<ServerFile> {
  const account = await getAccount(accountName)

  await progress([0, `Extracting the tables names from database`])
  const tables = await account.execute("SELECT name FROM sqlite_master WHERE type='table'")
  const tableNames = tables.map((row) => row[0] as string)
  await progress([10, `Extracted the tables names from database`])

  await progress([10, `Writing the zip file`])
  const zip = new JSZip()

  for (const tableName of tableNames) {
    // TODO9: are you sure?
    if (tableName !== "sqlite_sequence") {
      await progress([undefined, `Writing the file for table ${tableName}`])
      const csvContent = await exportTableToCSV(account, tableName, progress)
      zip.file(`${tableName}.csv`, csvContent)
    }
  }
  await progress([60, `Wrote the zip file`])

  const bufferData = await zip.generateAsync({ type: "nodebuffer" })
  console.log("Buffer completed")

  await progress([70, `Saving file with name ${accountName}-backup.zip`])
  const fileRecord = saveBackupFile(accountName, bufferData, `${accountName}-backup.zip`)
  await progress([90, `Saved file with name ${accountName}-backup.zip `])
  return fileRecord
}

async function saveBackupFile(
  accountName: string,
  bufferData: Buffer,
  name: string
): Promise<ServerFile> {
  const fileRecord = await upsertServerFile(accountName, {
    createdBy: "system",
    metadata: {
      lastModified: Date.now(),
      size: bufferData.length,
      type: "application/zip",
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
    return
  }
  console.log("Path:", filePath)

  return fileRecord
}

export async function restoreAccount(
  accountName: string,
  fileRecord: ServerFile,
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  await progress([0, "Restoring the account"])
  const account = await getAccount(accountName)

  await progress([0, "Extracting the files from zip"])
  const file = Bun.file(join(FILES_LOCATION, accountName, fileRecord.id.toString()))
  const zip = new JSZip()
  const zipContents = await zip.loadAsync(await file.arrayBuffer(), { base64: true })
  let fileIndex = 0
  const files = Object.keys(zipContents.files).length
  await progress([0, "Files extracted"])

  for (const fileName of Object.keys(zipContents.files)) {
    await progress([(100 / files) * fileIndex, `Restoring ${fileName}`])
    if (fileName.endsWith(".csv")) {
      console.log(fileName, "started")
      const tableName = fileName.slice(0, -4)
      const zipFileEntry = zipContents.file(fileName)
      if (!zipFileEntry) {
        console.warn(`File ${fileName} not found in zip.`)
        throw new Error(`File ${fileName} not found in zip.`)
      }

      const csvContent = await zipFileEntry.async("text")
      const rows = csvContent.split("\n")
      const columns = extractColumnsFromRow(rows[0])

      let insertSQL = `
      INSERT INTO ${tableName} (${columns.join(", ")}) 
      VALUES (${columns.map(() => "?").join(", ")})
      `
      if (fileName.includes("server_tasks")) {
        insertSQL = `
          INSERT INTO ${tableName} (${columns.slice(1).join(", ")}) 
          VALUES (${columns
            .slice(1)
            .map(() => "?")
            .join(", ")})
          `
      }

      for (let i = 1; i < rows.length; i++) {
        try {
          console.log("🚀 ~ rows[i]:", typeof rows[i], rows[i])
          let rowContent = extractColumnsFromRow(rows[i], columns.length)
          if (fileName.includes("server_tasks")) {
            rowContent = rowContent.slice(1)
          }
          await account.execute(
            insertSQL,
            rowContent.map((value) => value || null)
          )
        } catch (error) {
          throw new Error(
            `Could not parse row ${i} of ${fileName} with content ${rows[i]}, error: ${error.message}`
          )
        }
      }
      console.log(fileName, "finished")
    } else {
      throw new Error(`The file ${fileName} is not csv.`)
    }
    fileIndex++
  }
  await progress([100, `Restore completed`])
}

export async function enqueueBackup(accountName: string, trigger: TaskTrigger) {
  return new Promise<ServerFile>((resolve, reject) => {
    enqueueTask(accountName, {
      description:
        "Backup account data, which can be used for restoring or migrating to another device.",
      determinate: true,
      function: async (progress) => {
        try {
          const fileRecord = await backupAccount(accountName, progress)
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
    description: "Restore account data.",
    determinate: true,
    function: async (progress) => {
      await restoreAccount(accountName, file, progress)
    },
    name: "Restore account",
    priority: TaskPriority.Highest,
    trigger,
  })
}
