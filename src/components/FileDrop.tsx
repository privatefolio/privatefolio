import { Add, FolderOutlined } from "@mui/icons-material"
import { Button, ButtonProps, Stack, Typography, useTheme } from "@mui/material"
import { proxy } from "comlink"
import React, { useCallback, useRef, useState } from "react"
import { ConfirmDialogContextType, useConfirm } from "src/hooks/useConfirm"
import { ParserContextFn } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { extractFromZip, formatCamelCase } from "src/utils/utils"

import { enqueueTask, TaskPriority } from "../stores/task-store"
import { handleAuditLogChange } from "../utils/common-tasks"
import { clancy } from "../workers/remotes"
import { AddressInputUncontrolled } from "./AddressInput"
import { CircularSpinner } from "./CircularSpinner"
import { SectionTitle } from "./SectionTitle"

export function FileDrop(props: ButtonProps) {
  const theme = useTheme()

  const { size, sx, ...rest } = props

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

  const handleFileUpload = useCallback(
    async (file: File) => {
      const csvFiles =
        file.type === "application/x-zip-compressed" ? await extractFromZip(file) : [file]

      for (const csvFile of csvFiles) {
        enqueueTask({
          description: `Importing "${csvFile.name}".`,
          determinate: true,
          function: async (progress) => {
            const { metadata } = await clancy.addFileImport(
              csvFile,
              progress,
              $activeAccount.get(),
              proxy(createParserContextFn(confirm, csvFile))
            )
            if (metadata.logs > 0) {
              handleAuditLogChange()
            }
          },
          name: `Import file`,
          priority: TaskPriority.VeryHigh,
        })
      }
    },
    [confirm]
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
          clones.forEach(handleFileUpload)
        })
      }
    },
    [handleFileUpload]
  )

  // ProTip: this callback cannot be async because it doesn't work on mobile
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target

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
          clones.forEach(handleFileUpload)
        })
      }
    },
    [handleFileUpload]
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
        )}
      </Typography>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        accept=".csv, .zip"
        multiple
      />
    </Button>
  )
}

function createParserContextFn(confirm: ConfirmDialogContextType["confirm"], file: File) {
  const possibleUserAddress = file.name.match(/0x[a-fA-F0-9]{40}/)?.[0]

  return async function getParserContext(requirements: string[]) {
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
                <AddressInputUncontrolled
                  variant="outlined"
                  fullWidth
                  initialValue={possibleUserAddress}
                  size="small"
                  required
                  name={requirement}
                />
              </div>
            )
          })}
        </>
      ),
      title: "Import file needs extra information",
    })

    if (confirmed && event) {
      const formData = new FormData(event.target as HTMLFormElement)
      const parserContext = requirements.reduce(
        (acc, requirement) => ({
          ...acc,
          [requirement]: formData.get(requirement),
        }),
        {} as ReturnType<ParserContextFn>
      )

      return parserContext
    }

    throw new Error("User did not provide necessary information.")
  } as ParserContextFn
}
