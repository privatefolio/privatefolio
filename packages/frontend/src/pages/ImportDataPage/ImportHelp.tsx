import {
  AlertTitle,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { Callout } from "src/components/Callout"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { ExtensionAvatar } from "src/components/ExtensionAvatar"
import { Tabs } from "src/components/Tabs"
import { useBoolean } from "src/hooks/useBoolean"
import { RichExtension } from "src/interfaces"
import { $rpc } from "src/workers/remotes"

type ImportHelpProps = {
  extension?: RichExtension
  extensionType: RichExtension["extensionType"]
}

export function ImportHelp(props: ImportHelpProps) {
  const { extensionType, extension } = props
  const { value: modalOpen, toggle: toggleModalOpen } = useBoolean(false)

  const [tab, setTab] = useState<string>("")
  const [extensions, setExtensions] = useState<RichExtension[]>([])

  const rpc = useStore($rpc)

  useEffect(() => {
    if (!extension) return
    setTab(extension.id)
  }, [extension])

  useEffect(() => {
    rpc
      .getExtensions(true)
      .then((extensions) => {
        const filteredExtensions = extensions.filter((x) => x.extensionType === extensionType)
        setTab(filteredExtensions[0]?.id)
        return filteredExtensions
      })
      .then(setExtensions)
  }, [rpc, extensionType])

  const HowToComponent = useMemo(() => {
    const ext = extension || extensions.find((x) => x.id === tab)
    if (!ext?.howTo) return null
    return lazy(() => import(`../../extensions/${ext.howTo}.tsx`))
  }, [extension, extensions, tab])

  if (extension && !extension.howTo) return null

  return (
    <>
      <Callout
        onClick={toggleModalOpen}
        sx={{
          "&:hover": {
            backgroundColor: "var(--mui-palette-action-hover) !important",
          },
          cursor: "pointer",
        }}
      >
        {extensionType === "file-import" && (
          <>
            <AlertTitle>Need help with exporting your data?</AlertTitle>
            <Typography variant="body2" color="text.secondary">
              Click here to learn how to export your data from{" "}
              {extension ? extension.extensionName : "Etherscan, Binance and more"}.
            </Typography>
          </>
        )}
        {extensionType === "connection" && (
          <>
            <AlertTitle>Need help with connecting to your data?</AlertTitle>
            <Typography variant="body2" color="text.secondary">
              Click here to learn how to connect to your data on{" "}
              {extension ? extension.extensionName : "Etherscan, Binance and more"}.
            </Typography>
          </>
        )}
      </Callout>
      <Dialog open={modalOpen} onClose={toggleModalOpen}>
        {/* TODO add fullscreen on desktop and scrollbar on mobile */}
        <DialogTitle>
          {extensionType === "file-import" && <span>How to export your data</span>}
          {extensionType === "connection" && <span>How to connect to your data</span>}
        </DialogTitle>
        <DialogContent sx={{ maxWidth: 540, minWidth: 320, paddingX: 2, width: 540 }}>
          <div>
            <Tabs
              value={tab}
              onChange={(event: React.SyntheticEvent, newValue: string) => {
                setTab(newValue)
              }}
            >
              {extensions.map((extension) => (
                <Tab
                  sx={{ textTransform: "none" }}
                  key={extension.id}
                  value={extension.id}
                  label={
                    <Stack direction="row" alignItems={"center"} gap={0.5}>
                      <ExtensionAvatar
                        size="small"
                        src={extension.extensionLogoUrl}
                        alt={extension.extensionName}
                      />
                      {extension.extensionName}
                    </Stack>
                  }
                />
              ))}
            </Tabs>
            {HowToComponent && (
              <Suspense fallback={<DefaultSpinner wrapper />}>
                <HowToComponent />
              </Suspense>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleModalOpen} color="secondary" sx={{ paddingX: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
