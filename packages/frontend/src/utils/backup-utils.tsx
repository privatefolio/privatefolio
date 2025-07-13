import { closeSnackbar, enqueueSnackbar } from "notistack"
import { $rest, RPC } from "src/workers/remotes"

import { requestFile } from "./utils"

export async function handleBackupRequest(rpc: RPC, accountName: string) {
  const snackbarKey = enqueueSnackbar("Enqueuing backup...", { persist: true, variant: "info" })
  try {
    const fileRecord = await rpc.enqueueBackup(accountName, "user")
    closeSnackbar(snackbarKey)
    enqueueSnackbar("Backup ready for download", {
      accountName,
      autoHideDuration: null,
      fileRecord,
      rpc,
      variant: "fileDownload",
    })
  } catch (error) {
    enqueueSnackbar("An error occurred while creating the file", {
      variant: "error",
    })
  }
}

export async function handleExportTransactionsRequest(rpc: RPC, accountName: string) {
  const snackbarKey = enqueueSnackbar("Enqueuing export...", { persist: true, variant: "info" })
  try {
    const fileRecord = await rpc.enqueueExportTransactions(accountName, "user")
    closeSnackbar(snackbarKey)
    enqueueSnackbar("Transactions export ready for download", {
      accountName,
      autoHideDuration: null,
      fileRecord,
      rpc,
      variant: "fileDownload",
    })
  } catch (error) {
    enqueueSnackbar("An error occurred while creating the file", {
      variant: "error",
    })
  }
}

export async function handleExportAuditLogsRequest(rpc: RPC, accountName: string) {
  const snackbarKey = enqueueSnackbar("Enqueuing export...", { persist: true, variant: "info" })
  try {
    const fileRecord = await rpc.enqueueExportAuditLogs(accountName, "user")
    closeSnackbar(snackbarKey)
    enqueueSnackbar("Audit logs export ready for download", {
      accountName,
      autoHideDuration: null,
      fileRecord,
      rpc,
      variant: "fileDownload",
    })
  } catch (error) {
    enqueueSnackbar("An error occurred while creating the file", {
      variant: "error",
    })
  }
}

export async function onRestoreRequest(rpc: RPC, activeAccount: string, handleClose: () => void) {
  const file = await requestFile([".zip"], false)
  handleClose()
  await rpc.resetAccount(activeAccount)
  const fileRecord = await handleRestoreRequest(rpc, activeAccount, file[0])
  await rpc.enqueueRestore(activeAccount, "user", fileRecord)
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
    console.log("File uploaded")
  } else {
    const errorText = await response.text()
    console.error("Error uploading file:", errorText)
  }

  return fileRecord
}
