import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded"
import { IconButton, Tooltip } from "@mui/material"
import { enqueueSnackbar } from "notistack"
import React from "react"
import { $rest, RPC } from "src/workers/remotes"

import { downloadFile, requestFile } from "./utils"

export async function onRestoreRequest(rpc: RPC, activeAccount: string, handleClose: () => void) {
  const file = await requestFile([".zip"], false)
  handleClose()
  await rpc.resetAccount(activeAccount)
  const fileRecord = await handleRestoreRequest(rpc, activeAccount, file[0])
  await rpc.enqueueRestore(activeAccount, "user", fileRecord)
}

export async function handleBackupRequest(rpc: RPC, accountName: string) {
  const snackbarKey = enqueueSnackbar("Backup queued", { persist: true, variant: "info" })
  try {
    const fileRecord = await rpc.enqueueBackup(accountName, "user")
    enqueueSnackbar(
      <div>
        <span>Backup ready for download</span>
        <Tooltip title="Download">
          <IconButton
            aria-label="download"
            color="inherit"
            onClick={async () => {
              const params = new URLSearchParams({
                accountName,
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
        key: snackbarKey,
        variant: "success",
      }
    )
  } catch (error) {
    enqueueSnackbar("An error occurred while creating the file", {
      key: snackbarKey,
      variant: "error",
    })
  }
}

export async function handleRestoreRequest(rpc: RPC, accountName: string, file: File) {
  const fileRecord = await rpc.upsertServerFile(accountName, {
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
  formData.append("accountName", accountName)
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
