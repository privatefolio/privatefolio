import { createWriteStream } from "fs"
import { access, mkdir, open, readFile, stat } from "fs/promises"
import mime from "mime-types"
import { join } from "path"
import { corsHeaders, FILES_LOCATION } from "src/settings/settings"
import { getPrefix } from "src/utils/utils"
import { promisify } from "util"

import { Api } from "../api"

export async function handlePreflight(): Promise<Response> {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  })
}

export async function handleDownload(request: Request, writeApi: Api): Promise<Response> {
  const { method } = request
  const { searchParams } = new URL(request.url)

  if (method !== "GET")
    return new Response("Method not allowed - only GET is allowed.", {
      headers: corsHeaders,
      status: 405,
    })

  const accountName = searchParams.get("accountName")
  const fileId = searchParams.get("fileId")

  if (!accountName)
    return new Response("Search parameter 'accountName' missing.", {
      headers: corsHeaders,
      status: 400,
    })
  if (!fileId)
    return new Response("Search parameter 'fileId' missing.", {
      headers: corsHeaders,
      status: 400,
    })

  const filePath = join(FILES_LOCATION, accountName, fileId)

  // Check if the file exists in the database, and if its status is completed
  const fileRecord = await writeApi.getServerFile(accountName, parseInt(fileId))
  if (!fileRecord || fileRecord.status === "deleted") {
    return new Response("File not found.", {
      headers: corsHeaders,
      status: 400,
    })
  }
  if (fileRecord.status !== "completed") {
    return new Response("File is currently being written to. Please try again later.", {
      headers: corsHeaders,
      status: 409,
    })
  }

  // Check if the file exists
  try {
    await access(filePath)
  } catch {
    return new Response("File not found", { headers: corsHeaders, status: 404 })
  }

  // Check if the file is being written to (basic write-lock simulation using fs.open with O_EXCL flag)
  try {
    const fileHandle = await open(filePath, "r+") // Open the file in read/write mode
    await fileHandle.close() // If it opens fine, file is not being written to
  } catch (error) {
    if (error.code === "EBUSY" || error.code === "EACCES") {
      return new Response("File is currently being written to. Please try again later.", {
        headers: corsHeaders,
        status: 409,
      })
    }

    return new Response("An error occurred while opening the file.", {
      headers: corsHeaders,
      status: 500,
    })
  }

  const contentType = mime.lookup(filePath) || "application/octet-stream"
  const fileStats = await stat(filePath)

  await access(filePath)
  const fileBuffer = await readFile(filePath)
  return new Response(fileBuffer, {
    headers: {
      // "Cache-Control": "no-cache",
      "Cache-Control": "public, max-age=31536000, immutable", // 1 year in seconds, cache forever
      "Content-Disposition": `attachment; filename="${fileRecord.name}"`,
      "Content-Length": fileStats.size.toString(),
      "Content-Type": contentType,
      Expires: new Date(Date.now() + 31536000000).toUTCString(), // 1 year from now
      "Last-Modified": new Date(fileStats.mtime).toUTCString(),
      ...corsHeaders,
    },
  })
}

export async function handleUpload(request: Request, writeApi: Api): Promise<Response> {
  const { method } = request

  if (method !== "POST") {
    return new Response("Method not allowed - only POST is allowed.", {
      headers: corsHeaders,
      status: 405,
    })
  }

  const contentType = request.headers.get("Content-Type") || ""

  // Ensure that the request is multipart/form-data
  if (!contentType.startsWith("multipart/form-data")) {
    return new Response("Unsupported content type, expected multipart/form-data.", {
      headers: corsHeaders,
      status: 415,
    })
  }

  const formData = await request.formData()

  // Extract accountName and file from the form data
  const accountName = formData.get("accountName") as string | null
  const fileId = formData.get("fileId") as string | null
  const file = formData.get("file") as File | null

  // Ensure accountName is provided
  if (!accountName) {
    return new Response("Field 'accountName' is required.", { headers: corsHeaders, status: 400 })
  }

  // Ensure the file id is provided
  if (!fileId) {
    return new Response("Field 'fileId' is required.", { headers: corsHeaders, status: 400 })
  }

  // Ensure the file is valid
  if (!file || !file.name || !file.stream) {
    return new Response("Field 'file' is missing or invalid.", {
      headers: corsHeaders,
      status: 400,
    })
  }

  const fileRecord = await writeApi.getServerFile(accountName, Number(fileId))

  if (!fileRecord) {
    return new Response("File record not found.", {
      headers: corsHeaders,
      status: 404,
    })
  }

  console.log(getPrefix(accountName), `Uploading file: ${fileRecord.name}`)

  await writeApi.patchServerFile(accountName, fileRecord.id, {
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

  // Write the uploaded file to the file system
  try {
    // Create a write stream to write the file as chunks are received
    const fileStream = file.stream() // Get the file's readable stream
    const reader = fileStream.getReader()
    const writeStream = createWriteStream(filePath)

    let result: Bun.ReadableStreamDefaultReadResult<Uint8Array>

    // Read all chunks of data from the stream
    while (!(result = await reader.read()).done) {
      const chunk = result.value
      console.log(
        getPrefix(accountName),
        `Received chunk of size ${chunk.byteLength} bytes of file ${fileRecord.name}`
      )
      // Write each chunk directly to the file
      writeStream.write(Buffer.from(chunk))
    }

    // Finalize the write stream once all chunks are written
    await promisify(writeStream.end.bind(writeStream))()

    await writeApi.patchServerFile(accountName, fileRecord.id, {
      completedAt: Date.now(),
      progress: 100,
      status: "completed",
      //
    })
  } catch (error) {
    await writeApi.patchServerFile(accountName, fileRecord.id, {
      completedAt: Date.now(),
      status: "aborted",
      //
    })

    return new Response("An error occurred while uploading the file.", {
      headers: corsHeaders,
      status: 500,
    })
  }

  console.log(getPrefix(accountName), `File uploaded successfully: ${fileRecord.name}`)

  return new Response("File uploaded successfully.", { headers: corsHeaders, status: 200 })
}
