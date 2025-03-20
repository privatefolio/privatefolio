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
import React, { useState } from "react"
import { Callout } from "src/components/Callout"
import { PlatformAvatar } from "src/components/PlatformAvatar"
import { Tabs } from "src/components/Tabs"
import { useBoolean } from "src/hooks/useBoolean"
import { ParserId, PARSERS_META } from "src/settings"

import { BinanceHelp } from "./help/BinanceHelp"
import { BinanceSpotHelp } from "./help/BinanceSpotHelp"
import { EtherscanHelp } from "./help/EtherscanHelp"
import { PrivatefolioHelp } from "./help/PrivatefolioHelp"

const DOCUMENTED_PARSERS: ParserId[] = [
  "etherscan",
  "binance-account-statement",
  "privatefolio",
  // "binance-spot-history",
]

export function FileImportHelp() {
  const { value: modalOpen, toggle: toggleModalOpen } = useBoolean(false)

  const [tab, setTab] = useState<ParserId>("etherscan")

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTab(newValue as ParserId)
  }

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
            <Tabs value={tab} onChange={handleTabChange}>
              {DOCUMENTED_PARSERS.map((parserId) => (
                <Tab
                  sx={{ textTransform: "none" }}
                  key={parserId}
                  value={parserId}
                  label={
                    <Stack direction="row" alignItems={"center"} gap={0.5}>
                      <PlatformAvatar
                        size="small"
                        src={`./app-data/integrations/${parserId.split("-")[0].toLowerCase()}.svg`}
                        alt={parserId}
                      />
                      {PARSERS_META[parserId].name}
                    </Stack>
                  }
                />
              ))}
            </Tabs>
            {tab === "binance-account-statement" && <BinanceHelp />}
            {tab === "binance-spot-history" && <BinanceSpotHelp />}
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
