import { CachedRounded } from "@mui/icons-material"
import { IconButton, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { formatShortcut, Key } from "src/components/SearchBar/Key"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

export function NetworthActions() {
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  return (
    <>
      <Tooltip
        title={
          <>
            Refresh all <Key variant="tooltip">{formatShortcut("$mod+a")}</Key>
          </>
        }
      >
        <IconButton
          color="secondary"
          onClick={() => {
            rpc.enqueueFetchPrices(activeAccount, "user")
            rpc.enqueueRefreshBalances(activeAccount, "user")
            rpc.enqueueRefreshNetworth(activeAccount, "user")
            // rpc.enqueueRefreshTrades(activeAccount, "user") // TODO9: currently broken
          }}
        >
          <CachedRounded fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  )
}
