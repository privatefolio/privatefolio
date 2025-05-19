import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded"
import { IconButton, Tooltip } from "@mui/material"
import { enqueueSnackbar } from "notistack"
import React from "react"
import { $activeAccount } from "src/stores/account-store"
import { $rest, $rpc } from "src/workers/remotes"

import { downloadFile } from "./utils"

export async function handleBackupRequest() {
  enqueueSnackbar("Backup queued", { persist: true, variant: "info" })
  const accountName = $activeAccount.get()
  try {
    const fileRecord = await $rpc.get().enqueueBackup(accountName, "user")
    enqueueSnackbar(
      <div>
        <span>Backup ready for download</span>
        <Tooltip title="Download">
          <IconButton
            aria-label="download"
            color="inherit"
            onClick={async () => {
              const params = new URLSearchParams({
                accountName: $activeAccount.get(),
                fileId: fileRecord.id.toString(),
              })

              const { baseUrl, jwtKey } = $rest.get()

              const response = await fetch(`${baseUrl}/download?${params.toString()}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem(jwtKey)}` },
              })

              const blob = await response.blob()

              downloadFile(blob, fileRecord.name)
            }}
          >
            <DownloadRoundedIcon />
          </IconButton>
        </Tooltip>
      </div>,
      {
        autoHideDuration: null,
        variant: "success",
      }
    )
  } catch (error) {
    enqueueSnackbar("An error occurred while creating the file", { variant: "error" })
  }
}

export async function handleRestoreRequest(file: File) {
  const fileRecord = await $rpc.get().upsertServerFile($activeAccount.get(), {
    createdBy: "user",
    metadata: {
      lastModified: file.lastModified,
      size: file.size,
      type: file.type,
    },
    name: file.name,
    scheduledAt: Date.now(),
    status: "scheduled",
  })

  const formData = new FormData()
  formData.append("accountName", $activeAccount.get())
  formData.append("file", file)
  formData.append("fileId", fileRecord.id.toString())

  const { baseUrl, jwtKey } = $rest.get()

  const response = await fetch(`${baseUrl}/upload`, {
    body: formData,
    headers: { Authorization: `Bearer ${localStorage.getItem(jwtKey)}` },
    method: "POST",
  })

  if (response.ok) {
    console.log("File uploaded successfully")
  } else {
    const errorText = await response.text()
    console.error("Error uploading file:", errorText)
  }

  return fileRecord
}
