import { Add, FolderOutlined } from "@mui/icons-material"
import { Button, ButtonProps, Stack, Typography, useTheme } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useCallback, useRef, useState } from "react"
import { ConfirmDialogContextType, useConfirm } from "src/hooks/useConfirm"
import { ServerFile } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { handleRestoreRequest } from "src/utils/backup-utils"
import { formatCamelCase } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import { CircularSpinner } from "./CircularSpinner"
import { SectionTitle } from "./SectionTitle"
import { WalletInputUncontrolled } from "./WalletInput"

type FileDropProps = ButtonProps & {
  onSuccess?: (groupId: string) => void
}

export function FileDrop(props: FileDropProps) {
  const theme = useTheme()

  const { size, sx, children, onSuccess, ...rest } = props

  const [cloning, setCloning] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const confirm = useConfirm()

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const handleFileUpload = useCallback(
    async (file: File) => {
      const fileRecord = await handleRestoreRequest(rpc, activeAccount, file)

      const requirements = await rpc.getFileImportRequirements(activeAccount, fileRecord)

      const parserContext = !requirements
        ? {}
        : await getParserContext(confirm, fileRecord.name, requirements)

      return { fileRecord, parserContext }
    },
    [confirm, rpc, activeAccount]
  )

  const handleFileImport = useCallback(
    async (fileRecord: ServerFile, parserContext: Record<string, unknown>) => {
      const groupId = window.crypto.randomUUID()
      rpc.enqueueImportFile(activeAccount, "user", fileRecord.id, parserContext, groupId)
      onSuccess?.(groupId)
    },
    [rpc, activeAccount, onSuccess]
  )

  // ProTip: this callback cannot be async because it doesn't work on mobile
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDragOver(false)
      const { files } = event.dataTransfer

      if (files) {
        setCloning(true)
        // must clone the file, otherwise multiple upload doesn't work on mobile
        // https://github.com/GoogleChrome/developer.chrome.com/issues/2563#issuecomment-1464499084

        Promise.all(
          Array.from(files).map(async (file) => {
            const buffer = await file.arrayBuffer()
            return new File([buffer], file.name, {
              lastModified: file.lastModified,
              type: file.type,
            })
          })
        ).then((clones) => {
          setCloning(false)
          Promise.all(clones.map(handleFileUpload)).then((results) =>
            results.forEach(({ fileRecord, parserContext }) => {
              handleFileImport(fileRecord, parserContext)
            })
          )
        })
      }
    },
    [handleFileImport, handleFileUpload]
  )

  // ProTip: this callback cannot be async because it doesn't work on mobile
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target

      // TODO5: cloning still needed?

      if (files) {
        setCloning(true)
        // must clone the file, otherwise multiple upload doesn't work on mobile
        // https://github.com/GoogleChrome/developer.chrome.com/issues/2563#issuecomment-1464499084

        Promise.all(
          Array.from(files).map(async (file) => {
            const buffer = await file.arrayBuffer()
            return new File([buffer], file.name, {
              lastModified: file.lastModified,
              type: file.type,
            })
          })
        ).then((clones) => {
          setCloning(false)
          Promise.all(clones.map(handleFileUpload)).then((results) =>
            results.forEach(({ fileRecord, parserContext }) => {
              handleFileImport(fileRecord, parserContext)
            })
          )
        })
      }
    },
    [handleFileImport, handleFileUpload]
  )

  return (
    <Button
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      sx={{
        "&:hover": {
          backgroundColor: "var(--mui-palette-action-hover) !important",
        },
        backgroundColor: dragOver ? "var(--mui-palette-action-hover) !important" : undefined,
        // borderWidth: 2,
        color: theme.palette.text.primary,
        cursor: "pointer",
        padding: 1,
        textAlign: "start",
        transition: theme.transitions.create("background-color", {
          duration: theme.transitions.duration.shortest,
        }),
        ...sx,
      }}
      {...rest}
    >
      <Typography
        color="text.secondary"
        variant="body2"
        component="div"
        sx={{ minHeight: 22, width: "100%" }}
      >
        {cloning ? (
          <Stack>
            <span>
              <CircularSpinner
                size={12}
                color="inherit"
                sx={{ marginBottom: "-1px", marginRight: 1 }}
              />
              Uploading files...
            </span>
          </Stack>
        ) : (
          children || (
            <Stack
              alignItems={size === "large" ? "center" : "flex-start"}
              direction={size === "large" ? "column" : "row"}
            >
              {size === "large" ? (
                <FolderOutlined sx={{ height: 64, width: 64 }} />
              ) : (
                <Add sx={{ height: 20, marginRight: 1, width: 20 }} />
              )}

              <span>
                Click to <u>browse files</u> from your computer or <u>drag and drop</u> your{" "}
                <code>.csv</code> files here.
              </span>
            </Stack>
          )
        )}
      </Typography>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        accept=".csv"
        multiple
      />
    </Button>
  )
}

async function getParserContext(
  confirm: ConfirmDialogContextType["confirm"],
  fileName: string,
  requirements: string[]
) {
  const possibleUserAddress = fileName.match(/0x[a-fA-F0-9]{40}/)?.[0]
  const { confirmed, event } = await confirm({
    content: (
      <>
        Before this file import can be processed you need to fill the following form.
        <br />
        <br />
        {requirements.map((requirement, index) => {
          return (
            <div key={index}>
              <SectionTitle>{formatCamelCase(requirement)}</SectionTitle>
              <WalletInputUncontrolled
                variant="outlined"
                fullWidth
                initialValue={requirement === "userAddress" ? possibleUserAddress : undefined}
                size="small"
                required
                name={requirement}
                showAddressBook
                showWallets
                onlyEVM
              />
            </div>
          )
        })}
      </>
    ),
    dismissable: false,
    focusInput: requirements[0],
    title: "Import file needs extra information",
  })

  if (confirmed && event) {
    const formData = new FormData(event.target as HTMLFormElement)
    const responses = requirements.reduce(
      (acc, requirement) => ({
        ...acc,
        [requirement]: formData.get(requirement),
      }),
      {} as Record<string, unknown>
    )

    return responses
  }

  throw new Error("User did not provide necessary information.")
}
