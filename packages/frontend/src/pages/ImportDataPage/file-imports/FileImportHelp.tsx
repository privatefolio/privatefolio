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
import React, { useEffect, useState } from "react"
import { Callout } from "src/components/Callout"
import { PlatformAvatar } from "src/components/PlatformAvatar"
import { Tabs } from "src/components/Tabs"
import { useBoolean } from "src/hooks/useBoolean"
import { RichExtension } from "src/interfaces"
import { $rpc } from "src/workers/remotes"

import BinanceHelp from "./help/BinanceHelp"
import EtherscanHelp from "./help/EtherscanHelp"
import PrivatefolioHelp from "./help/PrivatefolioHelp"

export function FileImportHelp() {
  const { value: modalOpen, toggle: toggleModalOpen } = useBoolean(false)

  const [tab, setTab] = useState<string>("etherscan-file-import")
  const [extensions, setExtensions] = useState<RichExtension[]>([])

  useEffect(() => {
    $rpc.get().getExtensions(true).then(setExtensions)
  }, [])

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
        <AlertTitle sx={{ fontSize: "0.85rem" }}>How to create file imports?</AlertTitle>
        <Typography variant="body2" color="text.secondary">
          Click here to learn how to export your data from Etherscan or Binance.
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
                      <PlatformAvatar
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
            {tab === "binance-account-statement" && <BinanceHelp />}
            {/* {tab === "binance-spot-history" && <BinanceSpotHelp />} */}
            {tab === "etherscan" && <EtherscanHelp />}
            {tab === "privatefolio" && <PrivatefolioHelp />}
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
