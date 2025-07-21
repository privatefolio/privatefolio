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

export function SingleFileImportHelp(props: { extension: RichExtension }) {
  const { extension } = props
  const { value: modalOpen, toggle: toggleModalOpen } = useBoolean(false)

  const [tab, setTab] = useState<string>(extension.id)
  const [extensions, setExtensions] = useState<RichExtension[]>([])

  const rpc = useStore($rpc)

  useEffect(() => {
    setTab(extension.id)
  }, [extension.id])

  useEffect(() => {
    rpc.getExtensions(true).then(setExtensions)
  }, [rpc])

  const HowToComponent = useMemo(() => {
    const extension = extensions.find((x) => x.id === tab)
    if (!extension?.howTo) return null
    return lazy(() => import(`../../../extensions/${extension.howTo}.tsx`))
  }, [extensions, tab])

  if (extension.extensionType !== "file-import" || !extension.howTo) return null

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
        <AlertTitle>Need help with exporting your data?</AlertTitle>
        <Typography variant="body2" color="text.secondary">
          Click here to learn how to export your data from {extension.extensionName}.
        </Typography>
      </Callout>
      <Dialog open={modalOpen} onClose={toggleModalOpen}>
        {/* TODO add fullscreen on desktop and scrollbar on mobile */}
        <DialogTitle>
          <span>How to create file imports</span>
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
