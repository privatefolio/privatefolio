import { access, mkdir, rm, writeFile } from "fs/promises"
import { join } from "path"
import { patchServerFile, upsertServerFile } from "src/api/account/server-files-api"
import { ServerFile } from "src/interfaces"
import { FILES_LOCATION } from "src/settings/settings"

import { sleep } from "./utils"

export async function saveFile(
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

export async function safeRemove(path: string) {
  for (let i = 0; i < 5; i++) {
    try {
      await rm(path, { force: true, recursive: true })
      break
    } catch (err) {
      if (err.code === "EBUSY") {
        await sleep(100)
      } else {
        throw err
      }
    }
  }
}
