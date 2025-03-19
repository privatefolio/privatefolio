import { access, mkdir, writeFile } from "fs/promises"
import JSZip from "jszip"
import { join } from "path"
import { ProgressCallback, ServerFile, TaskPriority, TaskTrigger } from "src/interfaces"
import { FILES_LOCATION } from "src/settings"
import { createCsvString, noop } from "src/utils/utils"

import { Account, getAccount, recreateAccount } from "../accounts-api"
import { extractColumnsFromRow } from "./file-imports/csv-utils"
import { patchServerFile, upsertServerFile } from "./server-files-api"
import { enqueueTask } from "./server-tasks-api"

async function exportTableToCSV(account: Account, table: string) {
  const rows = await account.execute(`SELECT * FROM ${table}`)

  if (rows.length === 0) {
    // console.log(`Table ${table} is empty. No CSV created.`)
    return ""
  }
  const tableInfo = await account.execute(`PRAGMA table_info(${table})`)

  const columnNames = tableInfo.map((columnInfo) => columnInfo[1])

  const header = createCsvString([columnNames])
  const data = createCsvString(rows)
  const csvContent = `${header}\n${data}`

  return csvContent
}

export async function backupAccount(accountName: string): Promise<ServerFile> {
  const account = await getAccount(accountName)

  const tables = await account.execute("SELECT name FROM sqlite_master WHERE type='table'")

  const tableNames = tables.map((row) => row[0] as string)
  const zip = new JSZip()

  for (const tableName of tableNames) {
    if (tableName !== "sqlite_sequence") {
      const csvContent = await exportTableToCSV(account, tableName)
      zip.file(`${tableName}.csv`, csvContent)
    }
  }

  const bufferData = await zip.generateAsync({ type: "nodebuffer" })
  console.log("Buffer completed")

  const fileRecord = await upsertServerFile(accountName, {
    createdBy: "system",
    metadata: {
      lastModified: Date.now(),
      size: bufferData.length,
      type: "application/zip",
    },
    name: `${accountName}-backup.zip`,
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
  file: string,
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  await progress([0, "Resetting the account"])
  await recreateAccount(accountName)
  const account = await getAccount(accountName)

  const zip = new JSZip()
  const zipContents = await zip.loadAsync(file, { base64: true })
  let fileIndex = 0
  const files = Object.keys(zipContents.files).length

  for (const fileName of Object.keys(zipContents.files)) {
    await progress([(100 / files) * fileIndex, `Restoring ${fileName}`])
    if (fileName.endsWith(".csv")) {
      // console.log(fileName, "started")
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
        let rowContent = extractColumnsFromRow(rows[i], columns.length)
        if (fileName.includes("server_tasks")) {
          rowContent = rowContent.slice(1)
        }
        await account.execute(
          insertSQL,
          rowContent.map((value) => value || null)
        )
      }
      // console.log(fileName, "finished")
    } else {
      throw new Error(`The file ${fileName} is not csv.`)
    }
    fileIndex++
  }
  await progress([100, `Restore completed`])
}

export function enqueueBackup(accountName: string, trigger: TaskTrigger) {
  return new Promise<string>(() => {
    return enqueueTask(accountName, {
      description:
        "Backup account data, which can be used for restoring or migrating to another device.",
      determinate: true,
      function: async (progress) => {
        const file = await backupAccount(accountName)
        return file
      },
      name: "Backup",
      priority: TaskPriority.Low,
      trigger,
    })
  })
}

export async function enqueueRestore(accountName: string, file: string, trigger: TaskTrigger) {
  return new Promise<void>((resolve) => {
    return enqueueTask(accountName, {
      description: "Restore account data from a backup file.",
      determinate: true,
      function: async (progress) => {
        await restoreAccount(accountName, file, progress)
        resolve()
      },
      name: "Restore account",
      priority: TaskPriority.Highest,
      trigger,
    })
  })
}
