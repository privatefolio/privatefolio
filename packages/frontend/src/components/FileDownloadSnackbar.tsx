import { DownloadRounded } from "@mui/icons-material"
import { Tooltip } from "@mui/material"
import IconButton from "@mui/material/IconButton"
import { CustomContentProps, MaterialDesignContent } from "notistack"
import React from "react"
import { ServerFile } from "src/interfaces"
import { downloadFile } from "src/utils/utils"
import { $rest, RPC } from "src/workers/remotes"

interface FileDownloadSnackbarProps extends CustomContentProps {
  accountName: string
  fileRecord: ServerFile
  rpc: RPC
}

const FileDownloadSnackbar = React.forwardRef<HTMLDivElement, FileDownloadSnackbarProps>(
  (props, ref) => {
    const { fileRecord, accountName, message, ...rest } = props

    return (
      <MaterialDesignContent
        ref={ref}
        {...rest}
        variant="success"
        message={
          <div>
            {message}
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
                <DownloadRounded />
              </IconButton>
            </Tooltip>
          </div>
        }
      />
    )
  }
)

FileDownloadSnackbar.displayName = "FileDownloadSnackbar"

export { FileDownloadSnackbar }
